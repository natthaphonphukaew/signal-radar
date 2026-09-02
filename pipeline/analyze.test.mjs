// Tests for the fragile parts of the pipeline: transient-error retries and
// the validation that stops the model inventing sources.
//   run with:  npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { statusFromError, generateWithRetry, validateSignals } from './analyze.mjs'

// The exact shape Gemini returned when the first scheduled run failed.
const OVERLOADED =
  '[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/' +
  'v1beta/models/gemini-3.6-flash:generateContent: [503 Service Unavailable] This model is ' +
  'currently experiencing high demand.'

test('statusFromError extracts the HTTP status', () => {
  assert.equal(statusFromError(new Error(OVERLOADED)), 503)
  assert.equal(statusFromError(new Error('x: [429 Too Many Requests] quota')), 429)
  assert.equal(statusFromError(new Error('x: [404 Not Found] model gone')), 404)
  assert.equal(statusFromError(new Error('network down')), null)
})

test('retries a transient 503 and then succeeds', async () => {
  let calls = 0
  const flaky = {
    generateContent: async () => {
      calls++
      if (calls < 3) throw new Error(OVERLOADED)
      return { ok: true }
    },
  }
  const res = await generateWithRetry(flaky, 'prompt', 4, 5)
  assert.equal(res.ok, true)
  assert.equal(calls, 3)
})

test('does not retry a permanent error', async () => {
  let calls = 0
  const permanent = {
    generateContent: async () => {
      calls++
      throw new Error('x: [404 Not Found] model gone')
    },
  }
  await assert.rejects(() => generateWithRetry(permanent, 'prompt', 4, 5))
  assert.equal(calls, 1, 'should fail fast instead of burning retries')
})

test('gives up after the attempt limit', async () => {
  let calls = 0
  const dead = {
    generateContent: async () => {
      calls++
      throw new Error(OVERLOADED)
    },
  }
  await assert.rejects(() => generateWithRetry(dead, 'prompt', 4, 5))
  assert.equal(calls, 4)
})

// --- validation ---------------------------------------------------------

const articles = [
  { title: 'A', url: 'https://a.test', publisher: 'A pub', publishedAt: null },
  { title: 'B', url: 'https://b.test', publisher: 'B pub', publishedAt: null },
]
const base = {
  title: 'T',
  summary: 'S',
  soWhat: 'W',
  category: 'Business',
  impact: 3,
  confidence: 0.5,
  timeHorizon: 'Now',
  tags: [],
}

test('drops signals whose sources were invented', () => {
  const out = validateSignals([{ ...base, sourceIds: [99] }], articles)
  assert.equal(out.length, 0, 'an out-of-range article ID must not survive')
})

test('keeps signals backed by real articles and resolves the URL', () => {
  const out = validateSignals([{ ...base, sourceIds: [0, 1] }], articles)
  assert.equal(out.length, 1)
  assert.deepEqual(
    out[0].sources.map((s) => s.url),
    ['https://a.test', 'https://b.test'],
  )
})

test('clamps impact and confidence into range', () => {
  const out = validateSignals([{ ...base, impact: 99, confidence: 5, sourceIds: [0] }], articles)
  assert.equal(out[0].impact, 5)
  assert.equal(out[0].confidence, 1)
})

test('falls back to safe defaults for unknown enum values', () => {
  const out = validateSignals(
    [{ ...base, category: 'Nonsense', timeHorizon: 'Someday', sourceIds: [0] }],
    articles,
  )
  assert.equal(out[0].category, 'Business')
  assert.equal(out[0].timeHorizon, 'Now')
})

test('drops signals missing the "so what"', () => {
  const out = validateSignals([{ ...base, soWhat: '', sourceIds: [0] }], articles)
  assert.equal(out.length, 0)
})
