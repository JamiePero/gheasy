import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Fires a GA4 page_view on every client-side route change.
export default function RouteTracker() {
  const location = useLocation()
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      })
    }
  }, [location.pathname, location.search])
  return null
}
