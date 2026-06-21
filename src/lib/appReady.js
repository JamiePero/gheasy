// Signals when the app's primary content/data is ready, so the splash can fade
// once BOTH the minimum timer and the content are done (see App.jsx). Pages call
// markAppReady() when their data has loaded; window 'load' is a baseline fallback.

let resolve
export const appReady = new Promise((r) => {
  resolve = r
})

export function markAppReady() {
  if (resolve) {
    resolve()
    resolve = null
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') markAppReady()
  else window.addEventListener('load', () => markAppReady(), { once: true })
}
