import { useEffect, useState } from 'react'
import { BoltIcon } from './icons.jsx'

// Homepage install prompt (FIX 2). Hidden when already running standalone.
// Android/Chrome: "Download" triggers the captured beforeinstallprompt.
// iOS/Safari: "Add" reveals the Share → Add to Home Screen tip.
// Desktop: a hint to open on a phone.
export default function InstallSection() {
  const [prompt, setPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setStandalone(
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        window.navigator.standalone === true,
    )
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (standalone) return null // already installed — nothing to show

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice
    setPrompt(null)
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand/30 bg-card p-5 shadow-card">
      <div className="glow-mesh pointer-events-none absolute inset-0" />
      <div className="relative flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand">
          <BoltIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold">Get the easy app</p>
          <p className="text-sm text-muted">
            {isIOS
              ? 'Add easy to your home screen for one-tap access.'
              : prompt
                ? 'Install easy for faster, app-like access.'
                : 'Open gheasy.com on your phone to install.'}
          </p>
        </div>
        {prompt && (
          <button
            onClick={install}
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow"
          >
            Download
          </button>
        )}
        {isIOS && !prompt && (
          <button
            onClick={() => setShowIosHelp((v) => !v)}
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-glow"
          >
            Add
          </button>
        )}
      </div>
      {showIosHelp && (
        <p className="relative mt-3 rounded-2xl bg-surface p-3 text-xs text-muted">
          Tap the <span className="font-semibold text-fg">Share</span> button in Safari, then choose{' '}
          <span className="font-semibold text-fg">“Add to Home Screen”</span>.
        </p>
      )}
    </section>
  )
}
