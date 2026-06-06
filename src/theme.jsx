import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ theme: 'light', toggle: () => {}, setTheme: () => {} })
const STORAGE_KEY = 'gheasy-theme'

function getInitialTheme() {
  if (typeof document === 'undefined') return 'light'
  // The inline script in index.html has already applied the right class
  // before paint — read back from it so we stay perfectly in sync.
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme)

  const apply = useCallback((next) => {
    const root = document.documentElement
    root.classList.toggle('dark', next === 'dark')
    root.style.colorScheme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore storage failures (private mode etc.) */
    }
  }, [])

  const setTheme = useCallback(
    (next) => {
      setThemeState(next)
      apply(next)
    },
    [apply],
  )

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      apply(next)
      return next
    })
  }, [apply])

  // Keep in sync if the user changes OS theme and hasn't picked manually
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => {
      const stored = (() => {
        try {
          return localStorage.getItem(STORAGE_KEY)
        } catch {
          return null
        }
      })()
      if (!stored) setTheme(e.matches ? 'dark' : 'light')
    }
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [setTheme])

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
