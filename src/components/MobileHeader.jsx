import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 glass px-4 md:hidden">
      <Logo markClass="h-8 w-8" />
      <ThemeToggle className="h-9 w-9" />
    </header>
  )
}
