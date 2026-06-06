import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../theme.jsx'
import { MoonIcon, SunIcon } from './icons.jsx'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.88 }}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-border bg-surface text-fg transition-colors hover:border-brand/50 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ y: -16, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 16, opacity: 0, rotate: 40 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="grid place-items-center"
        >
          {dark ? (
            <MoonIcon className="h-[18px] w-[18px] text-brand" />
          ) : (
            <SunIcon className="h-[18px] w-[18px] text-amber-500" />
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
