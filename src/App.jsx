import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Radar, RefreshCw, AlertTriangle, Github, Sparkles, SearchX } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { useFeedback } from './hooks/useFeedback'
import { loadSignals, rankSignals, summarise, relativeTime } from './lib/signals'
import ThemeToggle from './components/ThemeToggle'
import StatTiles from './components/StatTiles'
import FilterBar from './components/FilterBar'
import SignalCard from './components/SignalCard'
import Charts from './components/Charts'

const REPO_URL = 'https://github.com/natthaphonphukaew/signal-radar'

export default function App() {
  const { theme, toggle } = useTheme()
  const { feedback, vote, reset } = useFeedback()

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    categories: [],
    horizon: 'All',
    minImpact: 1,
    q: '',
  })

  useEffect(() => {
    let alive = true
    loadSignals()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const signals = data?.signals ?? []
  const ranked = useMemo(() => rankSignals(signals, feedback), [signals, feedback])
  const summary = useMemo(() => summarise(signals), [signals])

  const counts = useMemo(() => {
    const c = {}
    for (const s of signals) c[s.category] = (c[s.category] || 0) + 1
    return c
  }, [signals])

  const visible = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    return ranked.filter((s) => {
      if (filters.categories.length && !filters.categories.includes(s.category)) return false
      if (filters.horizon !== 'All' && s.timeHorizon !== filters.horizon) return false
      if (s.impact < filters.minImpact) return false
      if (q) {
        const hay = [
          s.title, s.summary, s.soWhat, s.category,
          ...(s.tags || []),
          ...(s.sources || []).map((x) => `${x.title} ${x.publisher}`),
        ].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [ranked, filters])

  const votedCount = Object.keys(feedback).length

  return (
    <div className="min-h-screen bg-white text-zinc-800 dark:bg-[#0a0a0a] dark:text-zinc-200">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-900">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="section relative py-8 sm:py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-600 dark:text-accent-400">
                <Radar size={14} /> Thailand Trend Intelligence
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Signal <span className="text-gradient">Radar</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                An automated pipeline scans Thai news feeds every 6 hours, then an LLM clusters
                them into strategic signals across economic, business, industry, consumer and
                social trends — each with a “so what” for a strategy team.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Source code on GitHub"
                className="hidden h-10 w-10 place-items-center rounded-full border border-zinc-300 text-zinc-600 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-zinc-700 dark:text-zinc-300 sm:grid"
              >
                <Github size={17} />
              </a>
              <ThemeToggle theme={theme} toggle={toggle} />
            </div>
          </div>

          {data && (
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw size={13} /> Updated {relativeTime(data.generatedAt)}
              </span>
              {data.stats?.model && <span>Model: {data.stats.model}</span>}
              {data.stats?.feedsFailed > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {data.stats.feedsFailed} feed(s) unavailable this run
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="section space-y-6 py-8">
        {/* Sample-data banner */}
        {data?.isSample && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <Sparkles size={17} className="mt-0.5 shrink-0" />
            <p>
              <strong>Sample data.</strong> Sources are real articles pulled by the live collector,
              but the analysis text is placeholder. Add a <code className="rounded bg-black/10 px-1 dark:bg-white/10">GEMINI_API_KEY</code>{' '}
              and run the pipeline to generate real AI signals.
            </p>
          </div>
        )}

        {loading && (
          <div className="grid gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-40 animate-pulse" />
            ))}
          </div>
        )}

        {error && !data && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
            <p>Could not load signal data: {error}</p>
          </div>
        )}

        {data && (
          <>
            <StatTiles stats={data.stats} summary={summary} signalCount={signals.length} />
            <Charts signals={signals} byCat={summary.byCat} />

            <FilterBar
              filters={filters}
              setFilters={setFilters}
              counts={counts}
              total={signals.length}
              shown={visible.length}
            />

            {votedCount > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-accent-500/30 bg-accent-500/5 px-4 py-2.5 text-xs">
                <span className="text-zinc-600 dark:text-zinc-300">
                  Ranking personalised from <strong>{votedCount}</strong> rating
                  {votedCount > 1 ? 's' : ''} you gave.
                </span>
                <button onClick={reset} className="font-semibold text-accent-600 hover:underline dark:text-accent-400">
                  Clear
                </button>
              </div>
            )}

            <div className="grid gap-4">
              {visible.map((s, i) => (
                <SignalCard
                  key={s.id}
                  signal={s}
                  index={i}
                  vote={feedback[s.id] || 0}
                  onVote={vote}
                />
              ))}
            </div>

            {visible.length === 0 && (
              <div className="card grid place-items-center gap-2 p-12 text-center">
                <SearchX size={28} className="text-zinc-400" />
                <p className="font-semibold">No signals match these filters</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Try lowering the minimum impact or clearing the search.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-900">
        <div className="section flex flex-col items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-500 sm:flex-row">
          <p>Signal Radar — automated trend intelligence. Built by Natthaphon Phukaew.</p>
          <p>Data collected from public RSS feeds · analysis by Gemini</p>
        </div>
      </footer>
    </div>
  )
}
