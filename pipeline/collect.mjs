// Step 1–2: fetch RSS feeds, normalise and dedupe articles.
// No API key needed. One dead feed must never fail the whole run.

import { XMLParser } from 'fast-xml-parser'
import { pathToFileURL } from 'node:url'
import { FEEDS, LIMITS } from './feeds.js'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
})

const stripHtml = (s = '') =>
  String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

// Normalise a title for dedupe: lowercase, drop punctuation and the
// " - Publisher" suffix Google News appends.
const dedupeKey = (title = '') =>
  title
    .toLowerCase()
    .replace(/\s+-\s+[^-]+$/, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)

function itemsFrom(xml) {
  const doc = parser.parse(xml)
  // RSS 2.0
  if (doc?.rss?.channel) {
    const ch = doc.rss.channel
    return [].concat(ch.item || []).map((it) => ({
      title: stripHtml(it.title),
      url: typeof it.link === 'string' ? it.link : it.link?.['#text'] || '',
      publishedAt: it.pubDate || '',
      description: stripHtml(it.description),
      publisher: stripHtml(it.source?.['#text'] || it.source || ''),
    }))
  }
  // Atom
  if (doc?.feed) {
    return [].concat(doc.feed.entry || []).map((e) => {
      const link = [].concat(e.link || [])[0]
      return {
        title: stripHtml(e.title?.['#text'] ?? e.title),
        url: link?.['@_href'] || '',
        publishedAt: e.updated || e.published || '',
        description: stripHtml(e.summary?.['#text'] ?? e.summary ?? e.content?.['#text'] ?? ''),
        publisher: stripHtml(doc.feed.title?.['#text'] ?? doc.feed.title ?? ''),
      }
    })
  }
  return []
}

async function fetchFeed(feed, timeoutMs = 15000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'SignalRadar/1.0 (+portfolio project)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const items = itemsFrom(xml)
      .filter((a) => a.title && a.url)
      .slice(0, LIMITS.perFeed)
      .map((a) => ({
        ...a,
        publisher: a.publisher || feed.name,
        feed: feed.name,
        feedCategory: feed.category,
      }))
    return { ok: true, feed: feed.name, items }
  } catch (err) {
    return { ok: false, feed: feed.name, items: [], error: err.message }
  } finally {
    clearTimeout(timer)
  }
}

export async function collect() {
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f)))

  const seen = new Set()
  const articles = []
  // Round-robin across feeds so one prolific source can't crowd out the rest.
  const queues = results.map((r) => [...r.items])
  let added = true
  while (added && articles.length < LIMITS.totalArticles) {
    added = false
    for (const q of queues) {
      if (!q.length || articles.length >= LIMITS.totalArticles) continue
      const a = q.shift()
      added = true
      const key = dedupeKey(a.title)
      if (!key || seen.has(key)) continue
      seen.add(key)
      articles.push(a)
    }
  }

  const failed = results.filter((r) => !r.ok)
  return {
    articles,
    stats: {
      feedsScanned: FEEDS.length,
      feedsFailed: failed.length,
      articlesFetched: articles.length,
    },
    failures: failed.map((f) => ({ feed: f.feed, error: f.error })),
  }
}

// Allow running this file directly for offline debugging:  npm run collect
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = await collect()
  console.log(JSON.stringify(out.stats, null, 2))
  if (out.failures.length) console.log('failures:', out.failures)
  console.log('\nSample articles:')
  out.articles.slice(0, 8).forEach((a, i) =>
    console.log(`${i + 1}. [${a.feed}] ${a.title}\n   ${a.url}`),
  )
}
