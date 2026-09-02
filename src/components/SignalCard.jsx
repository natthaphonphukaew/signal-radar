import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ExternalLink, ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react'
import { catColor, relativeTime } from '../lib/signals'

function ImpactMeter({ value }) {
  return (
    <div className="flex items-center gap-1" title={`Impact ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-3.5 rounded-full ${
            i <= value ? 'bg-accent-500' : 'bg-zinc-200 dark:bg-zinc-700'
          }`}
        />
      ))}
    </div>
  )
}

// forwardRef is required: AnimatePresence mode="popLayout" attaches a ref to each child.
const SignalCard = forwardRef(function SignalCard({ signal, index, vote, onVote }, ref) {
  const [open, setOpen] = useState(false)
  const color = catColor(signal.category)

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
      className="card overflow-hidden transition-shadow duration-300 hover:shadow-glow-sm"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="p-5">
        {/* Meta row */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {signal.category}
          </span>
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {signal.timeHorizon}
          </span>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            {Math.round((signal.confidence ?? 0) * 100)}% confidence
          </span>
          <div className="ml-auto">
            <ImpactMeter value={signal.impact} />
          </div>
        </div>

        <h3 className="text-lg font-bold leading-snug">{signal.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {signal.summary}
        </p>

        {/* So what — the differentiator */}
        <div
          className="mt-3 flex gap-2.5 rounded-xl p-3"
          style={{ backgroundColor: `${color}14` }}
        >
          <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color }} />
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
            <span className="font-semibold" style={{ color }}>So what: </span>
            {signal.soWhat}
          </p>
        </div>

        {/* Tags */}
        {signal.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {signal.tags.map((t) => (
              <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:text-accent-600 dark:text-zinc-300 dark:hover:text-accent-300"
          >
            {signal.sources.length} source{signal.sources.length > 1 ? 's' : ''}
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-[11px] text-zinc-400 dark:text-zinc-500">Relevant?</span>
            <button
              onClick={() => onVote(signal.id, 1)}
              aria-label="Mark as relevant"
              aria-pressed={vote === 1}
              className={`grid h-7 w-7 place-items-center rounded-full border transition-colors ${
                vote === 1
                  ? 'border-accent-500 bg-accent-500 text-black'
                  : 'border-zinc-300 text-zinc-500 hover:border-accent-400 hover:text-accent-600 dark:border-zinc-700 dark:text-zinc-400'
              }`}
            >
              <ThumbsUp size={13} />
            </button>
            <button
              onClick={() => onVote(signal.id, -1)}
              aria-label="Mark as not relevant"
              aria-pressed={vote === -1}
              className={`grid h-7 w-7 place-items-center rounded-full border transition-colors ${
                vote === -1
                  ? 'border-rose-500 bg-rose-500 text-white'
                  : 'border-zinc-300 text-zinc-500 hover:border-rose-400 hover:text-rose-500 dark:border-zinc-700 dark:text-zinc-400'
              }`}
            >
              <ThumbsDown size={13} />
            </button>
          </div>
        </div>

        {/* Sources */}
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {signal.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 rounded-lg border border-zinc-200 p-2.5 transition-colors hover:border-accent-400 dark:border-zinc-800"
                >
                  <ExternalLink size={13} className="mt-0.5 shrink-0 text-zinc-400 group-hover:text-accent-500" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      {s.title}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-500">
                      {s.publisher}
                      {s.publishedAt ? ` · ${relativeTime(s.publishedAt)}` : ''}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </motion.article>
  )
})

export default SignalCard
