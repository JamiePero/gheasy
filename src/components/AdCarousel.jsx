import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { fetchAds } from '../lib/api.js'
import { LogoMark } from './Logo.jsx'

const DEFAULT_SLIDES = [
  {
    id: 'gh-1',
    title: 'Buy Data Instantly',
    description: 'MTN, Telecel & AirtelTigo — delivered in seconds',
    background: '#142b1b',
    color: '#ffffff',
    glow: true,
    logo: true,
  },
  {
    id: 'gh-2',
    title: 'MTN Bundles from GHS 4.80',
    description: "Ghana's largest network",
    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
    color: '#0A0F1E',
  },
  {
    id: 'gh-3',
    title: 'No login. No stress.',
    description: 'Pick, pay, done. GhEasy works for everyone.',
    background: '#030706',
    color: '#ffffff',
    accent: true,
  },
]

export default function AdCarousel() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES)
  const [index, setIndex] = useState(0)
  const timer = useRef(null)

  // Try the API; fall back to the default slides on empty/error.
  useEffect(() => {
    let alive = true
    fetchAds().then((ads) => {
      if (alive && ads.length > 0) {
        setSlides(
          ads.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            background: a.backgroundColor || '#142b1b',
            color: '#ffffff',
            image: a.imageUrl,
            link: a.linkUrl,
          })),
        )
        setIndex(0)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const count = slides.length
  useEffect(() => {
    if (count <= 1) return undefined
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), 4000)
    return () => clearInterval(timer.current)
  }, [count])

  const goTo = (i) => {
    setIndex(i)
    clearInterval(timer.current)
    if (count > 1) timer.current = setInterval(() => setIndex((p) => (p + 1) % count), 4000)
  }

  const slide = slides[index]
  const isLink = Boolean(slide.link)
  const Tag = isLink ? motion.a : motion.div

  return (
    <div className="relative h-[180px] w-full overflow-hidden rounded-2xl border border-border md:h-[230px]">
      <AnimatePresence mode="wait">
        <Tag
          key={slide.id ?? index}
          {...(isLink ? { href: slide.link, target: '_blank', rel: 'noopener noreferrer' } : {})}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center"
          style={{ background: slide.background, color: slide.color }}
        >
          {slide.glow && <span className="glow-mesh pointer-events-none absolute inset-0" />}
          {slide.image && (
            <>
              <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute inset-0 bg-black/40" />
            </>
          )}
          {slide.logo && <LogoMark className="relative h-12 w-12" />}
          {slide.accent && <span className="relative h-1 w-10 rounded-full bg-brand" />}
          <h3 className="relative font-display text-xl font-bold leading-tight sm:text-2xl">
            {slide.title}
          </h3>
          <p className="relative max-w-sm text-sm opacity-90 sm:text-base">{slide.description}</p>
        </Tag>
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id ?? i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
