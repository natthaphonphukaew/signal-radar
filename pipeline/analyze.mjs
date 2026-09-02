// Step 3–4: cluster articles into strategic signals with Gemini, then validate.
//
// Anti-hallucination design: the model never writes URLs. It only references
// article IDs from the input list, and we resolve those IDs back to the real
// articles ourselves. An invented ID is simply dropped.

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { LIMITS } from './feeds.js'

export const CATEGORIES = ['Economic', 'Business', 'Industry', 'Consumer', 'Social', 'Technology']
export const HORIZONS = ['Now', '3-6mo', '1yr+']

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    signals: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING, description: 'Short English headline for the signal (max 12 words)' },
          summary: { type: SchemaType.STRING, description: 'Two sentences in English: what is happening.' },
          soWhat: { type: SchemaType.STRING, description: 'One sentence in English: why a corporate strategy team should care.' },
          category: { type: SchemaType.STRING, enum: CATEGORIES, format: 'enum' },
          impact: { type: SchemaType.NUMBER, description: 'Strategic impact 1 (low) to 5 (high)' },
          confidence: { type: SchemaType.NUMBER, description: 'Evidence strength 0.0 to 1.0' },
          timeHorizon: { type: SchemaType.STRING, enum: HORIZONS, format: 'enum' },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          sourceIds: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.NUMBER },
            description: 'IDs of the supporting articles, taken ONLY from the provided list.',
          },
        },
        required: ['title', 'summary', 'soWhat', 'category', 'impact', 'confidence', 'timeHorizon', 'tags', 'sourceIds'],
      },
    },
  },
  required: ['signals'],
}

const PROMPT = `You are a senior corporate-strategy analyst covering THAILAND.

You receive a list of recent news articles (mostly Thai language), each with an ID.
Cluster related articles into at most ${LIMITS.maxSignals} distinct STRATEGIC SIGNALS.

A signal is a meaningful shift — not a single news item. Merge articles that describe
the same underlying development into ONE signal.

Rules:
- Write ALL output in ENGLISH, even though most sources are Thai.
- "summary": two sentences on what is happening.
- "soWhat": ONE sentence on the business implication — what a strategy team at a large
  Thai tech/consumer company should do or watch. Be specific and non-obvious.
  Never restate the summary.
- "impact": 1-5. Reserve 5 for shifts that change market structure or regulation.
- "confidence": 0.0-1.0 based on how many independent sources support it.
- "sourceIds": ONLY IDs that appear in the input list. Never invent an ID or a URL.
- Prefer signals that span multiple articles or have clear economic consequence.
- Drop pure PR, celebrity, sports and crime stories unless they carry economic weight.

Return strictly the JSON object described by the schema.`

function buildInput(articles) {
  return articles
    .map((a, i) => {
      const snippet = (a.description || '').slice(0, 220)
      return `ID ${i}: [${a.feedCategory}] ${a.title}${snippet ? `\n   ${snippet}` : ''}\n   (${a.publisher})`
    })
    .join('\n')
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n)))

// Transient server-side failures worth retrying. 429 = rate limited,
// 5xx = the model is overloaded (a 503 killed the first scheduled run).
// Anything else (bad key, bad model id, malformed request) is permanent.
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504])

export function statusFromError(err) {
  const m = String(err?.message || '').match(/\[(\d{3})\s/)
  if (m) return Number(m[1])
  return typeof err?.status === 'number' ? err.status : null
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Call the model, retrying transient errors with exponential backoff + jitter. */
export async function generateWithRetry(model, prompt, attempts = 4, backoffMs = 5000) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await model.generateContent(prompt)
    } catch (err) {
      const status = statusFromError(err)
      if (!TRANSIENT_STATUS.has(status) || attempt >= attempts) throw err
      // 5s, 15s, 45s (±25% jitter so retries don't sync up with other clients)
      const base = backoffMs * 3 ** (attempt - 1)
      const wait = Math.round(base * (0.75 + Math.random() * 0.5))
      console.warn(
        `  ! Gemini returned ${status} (attempt ${attempt}/${attempts}) — retrying in ${Math.round(wait / 1000)}s`,
      )
      await sleep(wait)
    }
  }
}

/** Validate model output and resolve source IDs back to real articles. */
export function validateSignals(raw, articles) {
  if (!Array.isArray(raw)) return []
  const out = []
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue
    const title = String(s.title || '').trim()
    const summary = String(s.summary || '').trim()
    const soWhat = String(s.soWhat || '').trim()
    if (!title || !summary || !soWhat) continue

    // Resolve IDs -> real articles. Invented IDs vanish here.
    const ids = Array.isArray(s.sourceIds) ? s.sourceIds : []
    const sources = []
    const seen = new Set()
    for (const id of ids) {
      const idx = Number(id)
      const a = articles[idx]
      if (!Number.isInteger(idx) || !a || seen.has(a.url)) continue
      seen.add(a.url)
      sources.push({
        title: a.title,
        url: a.url,
        publisher: a.publisher,
        publishedAt: a.publishedAt || null,
      })
    }
    if (sources.length === 0) continue // unsupported claim -> drop

    const category = CATEGORIES.includes(s.category) ? s.category : 'Business'
    const timeHorizon = HORIZONS.includes(s.timeHorizon) ? s.timeHorizon : 'Now'

    out.push({
      id: `sig-${out.length + 1}-${Date.now().toString(36)}`,
      title,
      summary,
      soWhat,
      category,
      impact: Math.round(clamp(s.impact ?? 3, 1, 5)),
      confidence: Number(clamp(s.confidence ?? 0.5, 0, 1).toFixed(2)),
      timeHorizon,
      tags: Array.isArray(s.tags) ? s.tags.map(String).filter(Boolean).slice(0, 6) : [],
      sources,
    })
  }
  return out
}

export async function analyze(articles) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not set')
  if (!articles.length) throw new Error('No articles to analyze')

  const modelId = process.env.GEMINI_MODEL || 'gemini-3.6-flash'
  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({
    model: modelId,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema,
    },
  })

  const result = await generateWithRetry(model, `${PROMPT}\n\nARTICLES:\n${buildInput(articles)}`)
  const text = result.response.text()

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error(`Model did not return valid JSON (model=${modelId})`)
  }

  const signals = validateSignals(parsed.signals, articles)
  if (!signals.length) throw new Error('No valid signals survived validation')
  return { signals, modelId }
}
