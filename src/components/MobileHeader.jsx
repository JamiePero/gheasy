import { useLocation } from 'react-router-dom'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function MobileHeader() {
  const { pathname } = useLocation()
  // Home renders its own greeting header.
  if (pathname === '/') return null
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 glass px-4 md:hidden">
      <Logo wordmarkClass="h-6" />
      <ThemeToggle className="h-9 w-9" />
    </header>
  )
}
