import { motion } from 'framer-motion'
import { Radar, Layers, Gauge, Newspaper } from 'lucide-react'
import { catColor } from '../lib/signals'
import { useLang, catLabel } from '../lib/i18n'

export default function StatTiles({ stats, summary, signalCount }) {
  const { lang, t } = useLang()
  const tiles = [
    { icon: Radar, label: t('statSignals'), value: signalCount, hint: `${stats?.articlesFetched ?? '—'} ${t('statArticles')}` },
    { icon: Layers, label: t('statTopCategory'), value: catLabel(lang, summary.topCategory), hint: `${summary.byCat[summary.topCategory] ?? 0} ${t('statSignalsCount')}`, color: catColor(summary.topCategory) },
    { icon: Gauge, label: t('statAvgImpact'), value: `${summary.avgImpact}/5`, hint: t('statWeighted') },
    { icon: Newspaper, label: t('statSources'), value: summary.uniqueSources, hint: `${stats?.feedsScanned ?? '—'} ${t('statFeeds')}` },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {tiles.map((tile, i) => (
        <motion.div
          key={tile.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="card p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <tile.icon size={15} style={tile.color ? { color: tile.color } : undefined} />
            <span className="text-xs font-medium">{tile.label}</span>
          </div>
          <p
            className="text-2xl font-black tracking-tight"
            style={tile.color ? { color: tile.color } : undefined}
          >
            {tile.value}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-500">{tile.hint}</p>
        </motion.div>
      ))}
    </div>
  )
}
