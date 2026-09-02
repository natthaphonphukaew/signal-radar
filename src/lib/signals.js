// Shared helpers: category metadata, loading, formatting and ranking.

export const CATEGORY_META = {
  Economic:   { color: '#f59e0b', label: 'Economic' },
  Business:   { color: '#10b981', label: 'Business' },
  Industry:   { color: '#3b82f6', label: 'Industry' },
  Consumer:   { color: '#ec4899', label: 'Consumer' },
  Social:     { color: '#a855f7', label: 'Social' },
  Technology: { color: '#06b6d4', label: 'Technology' },
}

export const CATEGORIES = Object.keys(CATEGORY_META)
export const HORIZONS = ['Now', '3-6mo', '1yr+']

export const catColor = (c) => CATEGORY_META[c]?.color || '#71717a'

/** Load live data, falling back to the bundled sample. */
export async function loadSignals() {
  const tryFetch = async (url) => {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }
  try {
    const data = await tryFetch('/data/signals.json')
    if (!Array.isArray(data?.signals) || !data.signals.length) throw new Error('empty')
    return { ...data, isSample: data.mode === 'sample' }
  } catch {
    const data = await tryFetch('/data/sample.json')
    return { ...data, isSample: true }
  }
}

export function relativeTime(iso) {
  if (!iso) return 'unknown'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'unknown'
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

/**
 * Rank = impact, weighted by confidence, nudged by the viewer's own feedback.
 * Feedback is a map of { [signalId]: 1 | -1 }.
 */
export function rankSignals(signals, feedback = {}) {
  const catBias = {}
  for (const [id, v] of Object.entries(feedback)) {
    const s = signals.find((x) => x.id === id)
    if (s) catBias[s.category] = (catBias[s.category] || 0) + v
  }
  return [...signals]
    .map((s) => {
      const vote = feedback[s.id] || 0
      const bias = (catBias[s.category] || 0) * 0.15
      const score = s.impact * (0.6 + 0.4 * (s.confidence ?? 0.5)) + vote * 2 + bias
      return { ...s, _score: score, _vote: vote }
    })
    .sort((a, b) => b._score - a._score)
}

export function summarise(signals) {
  const byCat = {}
  for (const s of signals) byCat[s.category] = (byCat[s.category] || 0) + 1
  const topCategory = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  const avgImpact = signals.length
    ? (signals.reduce((n, s) => n + s.impact, 0) / signals.length).toFixed(1)
    : '0'
  const sources = new Set()
  for (const s of signals) for (const src of s.sources || []) sources.add(src.publisher || src.url)
  return { byCat, topCategory, avgImpact, uniqueSources: sources.size }
}
