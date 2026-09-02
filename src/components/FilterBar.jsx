import { Search, RotateCcw } from 'lucide-react'
import { CATEGORIES, HORIZONS, catColor } from '../lib/signals'

export default function FilterBar({ filters, setFilters, counts, total, shown }) {
  const toggleCat = (c) =>
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(c)
        ? f.categories.filter((x) => x !== c)
        : [...f.categories, c],
    }))

  const reset = () => setFilters({ categories: [], horizon: 'All', minImpact: 1, q: '' })
  const isDirty =
    filters.categories.length || filters.horizon !== 'All' || filters.minImpact > 1 || filters.q

  return (
    <div className="card p-4 sm:p-5">
      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder="Search signals, tags or sources…"
          className="w-full rounded-full border border-zinc-200 bg-white/70 py-2.5 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-accent-400 dark:border-zinc-700 dark:bg-zinc-900/60 dark:placeholder:text-zinc-500"
        />
      </div>

      {/* Categories */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = filters.categories.includes(c)
          return (
            <button
              key={c}
              onClick={() => toggleCat(c)}
              className={`chip ${active ? 'chip-active' : ''}`}
              style={!active ? { borderLeft: `3px solid ${catColor(c)}` } : undefined}
            >
              {c}
              <span className={active ? 'opacity-70' : 'text-zinc-400 dark:text-zinc-500'}>
                {counts[c] || 0}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Horizon */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Horizon</span>
          {['All', ...HORIZONS].map((h) => (
            <button
              key={h}
              onClick={() => setFilters((f) => ({ ...f, horizon: h }))}
              className={`chip ${filters.horizon === h ? 'chip-active' : ''}`}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Min impact */}
        <div className="flex items-center gap-3">
          <label htmlFor="minImpact" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Min impact
          </label>
          <input
            id="minImpact"
            type="range"
            min="1"
            max="5"
            value={filters.minImpact}
            onChange={(e) => setFilters((f) => ({ ...f, minImpact: Number(e.target.value) }))}
            className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-zinc-200 accent-accent-500 dark:bg-zinc-700"
          />
          <span className="w-4 text-sm font-bold text-accent-600 dark:text-accent-400">
            {filters.minImpact}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Showing <span className="font-semibold text-accent-600 dark:text-accent-400">{shown}</span> of {total} signals
        </p>
        {isDirty ? (
          <button onClick={reset} className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-accent-600 dark:text-zinc-400 dark:hover:text-accent-300">
            <RotateCcw size={13} /> Reset
          </button>
        ) : null}
      </div>
    </div>
  )
}
