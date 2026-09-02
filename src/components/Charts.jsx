// Hand-rolled inline SVG charts — no chart library, readable in both themes.
import { CATEGORIES, catColor } from '../lib/signals'

function CategoryChart({ byCat }) {
  const rows = CATEGORIES.map((c) => ({ c, n: byCat[c] || 0 })).filter((r) => r.n > 0)
  const max = Math.max(1, ...rows.map((r) => r.n))
  const barH = 22
  const gap = 10
  const labelW = 92
  const height = rows.length * (barH + gap)

  if (!rows.length) return null

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-bold">Signals by category</h3>
      <svg
        viewBox={`0 0 320 ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Bar chart of signal counts by category"
      >
        {rows.map((r, i) => {
          const y = i * (barH + gap)
          const w = ((320 - labelW - 26) * r.n) / max
          return (
            <g key={r.c}>
              <text
                x="0"
                y={y + barH / 2 + 4}
                className="fill-zinc-600 dark:fill-zinc-300"
                style={{ fontSize: 11, fontWeight: 500 }}
              >
                {r.c}
              </text>
              <rect x={labelW} y={y} width={Math.max(w, 2)} height={barH} rx="5" fill={catColor(r.c)} opacity="0.85" />
              <text
                x={labelW + Math.max(w, 2) + 7}
                y={y + barH / 2 + 4}
                className="fill-zinc-500 dark:fill-zinc-400"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                {r.n}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ImpactChart({ signals }) {
  const buckets = [1, 2, 3, 4, 5].map((lvl) => ({
    lvl,
    n: signals.filter((s) => s.impact === lvl).length,
  }))
  const max = Math.max(1, ...buckets.map((b) => b.n))
  const W = 320
  const H = 130
  const pad = 24
  const colW = (W - pad * 2) / buckets.length

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-bold">Impact distribution</h3>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Impact distribution">
        {buckets.map((b, i) => {
          const h = ((H - pad * 2) * b.n) / max
          const x = pad + i * colW + colW * 0.18
          const w = colW * 0.64
          const y = H - pad - h
          return (
            <g key={b.lvl}>
              <rect
                x={x}
                y={y}
                width={w}
                height={Math.max(h, b.n ? 3 : 0)}
                rx="5"
                fill="#10b981"
                opacity={0.35 + 0.13 * b.lvl}
              />
              {b.n > 0 && (
                <text
                  x={x + w / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="fill-zinc-500 dark:fill-zinc-400"
                  style={{ fontSize: 10, fontWeight: 600 }}
                >
                  {b.n}
                </text>
              )}
              <text
                x={x + w / 2}
                y={H - pad + 14}
                textAnchor="middle"
                className="fill-zinc-500 dark:fill-zinc-400"
                style={{ fontSize: 11 }}
              >
                {b.lvl}
              </text>
            </g>
          )
        })}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} className="stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1" />
      </svg>
      <p className="mt-1 text-center text-[11px] text-zinc-500 dark:text-zinc-500">impact score (1–5)</p>
    </div>
  )
}

export default function Charts({ signals, byCat }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <CategoryChart byCat={byCat} />
      <ImpactChart signals={signals} />
    </div>
  )
}
