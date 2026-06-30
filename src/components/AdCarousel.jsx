import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LogoMark } from './Logo.jsx'

const BASE = 'https://api.getflashx.com'

// Resolve an ad's linkUrl. External (http/https) → new tab; internal ("/path")
// → in-app router navigation; empty → not clickable. A protocol-less value like
// "example.com" is treated as EXTERNAL (https:// prepended) so it never resolves
// as a relative path and lands on the SPA 404 page.
function resolveAdLink(linkUrl) {
  const u = String(linkUrl || '').trim()
  if (!u) return null
  if (/^https?:\/\//i.test(u)) return { external: true, href: u }
  if (u.startsWith('/')) return { external: false, to: u }
  return { external: true, href: `https://${u}` }
}

// Fallback promo slides shown until easy ads exist (managed in /admin → Ads / Media).
const DEFAULT_SLIDES = [
  { id: 'gh-1', title: 'Buy Data Instantly', description: 'MTN, Telecel & AirtelTigo — delivered in seconds', background: '#142b1b', color: '#ffffff', glow: true, logo: true },
  { id: 'gh-2', title: 'MTN Bundles from GHS 4.80', description: "Ghana's largest network", background: 'linear-gradient(135deg, #FFD700, #FFA500)', color: '#0A0F1E' },
  { id: 'gh-3', title: 'No login. No stress.', description: 'Pick, pay, done. easy works for everyone.', background: '#030706', color: '#ffffff', accent: true },
]

function DefaultSlide({ slide }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center" style={{ background: slide.background, color: slide.color }}>
      {slide.glow && <span className="glow-mesh pointer-events-none absolute inset-0" />}
      {slide.logo && <LogoMark className="relative h-12 w-12" />}
      {slide.accent && <span className="relative h-1 w-10 rounded-full bg-brand" />}
      <h3 className="relative font-display text-xl font-bold leading-tight sm:text-2xl">{slide.title}</h3>
      <p className="relative max-w-sm text-sm opacity-90 sm:text-base">{slide.description}</p>
    </div>
  )
}

function MediaSlide({ ad, eager }) {
  return (
    <div className="relative h-full w-full bg-black">
      {ad.mediaType === 'video' ? (
        <video src={ad.mediaUrl} autoPlay muted loop playsInline className="h-full w-full object-cover" />
      ) : (
        // First (above-the-fold) slide loads eagerly to protect LCP; the rest lazy-load.
        <img src={ad.mediaUrl} alt={ad.title || ''} loading={eager ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-cover" />
      )}
      {(ad.title || ad.description) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pb-8 text-left">
          {ad.title && <h3 className="font-display text-lg font-bold leading-tight text-white">{ad.title}</h3>}
          {ad.description && <p className="mt-0.5 text-xs text-white/85">{ad.description}</p>}
        </div>
      )}
    </div>
  )
}

// Top-of-home banner carousel. Renders easy ads (images + autoplay-muted-loop
// videos) from /gheasy/ads when present; otherwise the default promo slides.
export default function AdCarousel() {
  const [ads, setAds] = useState(null)
  const [index, setIndex] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    let alive = true
    fetch(`${BASE}/gheasy/ads`)
      .then((r) => r.json())
      .then((d) => { if (alive && d?.success && Array.isArray(d.ads) && d.ads.length) setAds(d.ads) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const isMedia = !!(ads && ads.length)
  const slides = isMedia ? ads : DEFAULT_SLIDES
  const count = slides.length

  useEffect(() => {
    setIndex(0)
    if (count <= 1) return undefined
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(timer.current)
  }, [count])

  const goTo = (i) => {
    setIndex(i)
    clearInterval(timer.current)
    if (count > 1) timer.current = setInterval(() => setIndex((p) => (p + 1) % count), 5000)
  }

  const slide = slides[Math.min(index, count - 1)]
  const content = isMedia ? <MediaSlide ad={slide} eager={index === 0} /> : <DefaultSlide slide={slide} />
  // Only media ads carry a linkUrl; image and video ads are handled identically.
  const link = isMedia ? resolveAdLink(slide.linkUrl) : null
  let body = content
  if (link?.external) {
    body = <a href={link.href} target="_blank" rel="noopener noreferrer" className="block h-full w-full">{content}</a>
  } else if (link) {
    body = <Link to={link.to} className="block h-full w-full">{content}</Link>
  }

  return (
    <div className="relative h-[180px] w-full overflow-hidden rounded-2xl border border-border md:h-[230px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {body}
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
