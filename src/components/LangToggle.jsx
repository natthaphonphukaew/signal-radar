import { Languages } from 'lucide-react'
import { useLang } from '../lib/i18n'

// Deliberately no AnimatePresence here: a mode="wait" swap can leave the old
// label mounted if the exit never completes, which made the button show the
// wrong language. A plain label is always correct.
export default function LangToggle() {
  const { t, toggle } = useLang()
  return (
    <button
      onClick={toggle}
      aria-label={t('switchLang')}
      title={t('switchLang')}
      className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-300 bg-white/70 px-3 text-sm font-semibold text-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400 hover:text-accent-500 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
    >
      <Languages size={16} />
      <span className="min-w-[1.9rem] text-center">{t('langLabel')}</span>
    </button>
  )
}
