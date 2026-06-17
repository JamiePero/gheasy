import { motion } from 'framer-motion'
import { LogoMark } from './Logo.jsx'

// Full-screen splash shown once per session on cold load (see App.jsx). Fades in
// with a gentle pulse; the parent fades the whole overlay out via AnimatePresence.
export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] grid place-items-center bg-[#030706]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: [0.9, 1.04, 1] }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <LogoMark className="h-24 w-24" />
      </motion.div>
    </motion.div>
  )
}
