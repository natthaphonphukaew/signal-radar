import { motion } from 'framer-motion'
import { Radar, Layers, Gauge, Newspaper } from 'lucide-react'
import { catColor } from '../lib/signals'

export default function StatTiles({ stats, summary, signalCount }) {
  const tiles = [
    { icon: Radar, label: 'Signals surfaced', value: signalCount, hint: `${stats?.articlesFetched ?? '—'} articles scanned` },
    { icon: Layers, label: 'Top category', value: summary.topCategory, hint: `${summary.byCat[summary.topCategory] ?? 0} signals`, color: catColor(summary.topCategory) },
    { icon: Gauge, label: 'Avg. impact', value: `${summary.avgImpact}/5`, hint: 'weighted by confidence' },
    { icon: Newspaper, label: 'Sources', value: summary.uniqueSources, hint: `${stats?.feedsScanned ?? '—'} feeds monitored` },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tiles.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="card p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <t.icon size={15} style={t.color ? { color: t.color } : undefined} />
            <span className="text-xs font-medium">{t.label}</span>
          </div>
          <p
            className="text-2xl font-black tracking-tight"
            style={t.color ? { color: t.color } : undefined}
          >
            {t.value}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-500">{t.hint}</p>
        </motion.div>
      ))}
    </div>
  )
}
