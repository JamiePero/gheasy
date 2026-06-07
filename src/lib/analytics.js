// Thin wrapper around GA4's gtag so calls are safe even if the script is
// blocked or not yet loaded.
export function track(event, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', event, params)
    }
  } catch {
    /* analytics must never break the app */
  }
}
