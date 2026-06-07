import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import AdCarousel from '../components/AdCarousel.jsx'
import NetworkLogo from '../components/NetworkLogo.jsx'
import Avatar from '../components/Avatar.jsx'
import { fetchBundles } from '../lib/api.js'
import { getAgentStore, getOrders, getProfile } from '../lib/store.js'
import { NETWORKS, firstName, formatCedis, getNetwork } from '../lib/format.js'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  GiftIcon,
  ReceiptIcon,
  ShieldIcon,
} from '../components/icons.jsx'

const WORDS = ['Anytime', 'Anywhere', 'Instantly', 'Effortlessly', '24/7']

function RotatingWord() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % WORDS.length), 2200)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="relative inline-block align-bottom">
      {/* invisible spacer sizes the box to the current word */}
      <span className="invisible">{WORDS[i]}.</span>
      <AnimatePresence initial={false}>
        <motion.span
          key={WORDS[i]}
          initial={{ y: '0.8em', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-0.8em', opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-0 text-gradient"
        >
          {WORDS[i]}.
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// Cheapest live bundle per network → "From ₵X"
function useNetworkFrom() {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    Promise.allSettled(NETWORKS.map((n) => fetchBundles(n.id))).then((res) => {
      if (!alive) return
      const out = {}
      res.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.length) out[NETWORKS[i].id] = r.value[0].sellPrice
      })
      setPrices(out)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])
  return { prices, loading }
}

export default function Home() {
  const navigate = useNavigate()
  const { prices, loading: pricesLoading } = useNetworkFrom()
  const [recent] = useState(() => getOrders().slice(0, 3))
  const [profile] = useState(() => getProfile())
  const [store] = useState(() => getAgentStore())
  const first = firstName(profile.name)

  return (
    <Page className="wrap-app pb-10">
      {/* Greeting header */}
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <Avatar src={profile.avatar} className="h-11 w-11" />
          <div>
            <p className="font-display text-lg font-bold leading-tight">
              {first ? `Hello ${first}` : 'Hi there'} 👋
            </p>
            <p className="text-xs text-muted">Stay connected with easy</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/refer"
            aria-label="Refer a friend"
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-brand transition-colors hover:border-brand/50"
          >
            <GiftIcon className="h-5 w-5" />
          </Link>
          <ThemeToggle className="h-10 w-10" />
        </div>
      </header>

      {/* Ad carousel — top of the page */}
      <div className="mt-5">
        <AdCarousel />
      </div>

      {/* Quick-buy hero card with rotating tagline */}
      <div className="relative mt-5 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="glow-mesh pointer-events-none absolute inset-0" />
        <div className="relative">
          <p className="font-display text-2xl font-bold leading-tight">
            Pay anything.
            <br />
            <RotatingWord />
          </p>
          <p className="mt-1 text-sm text-muted">Buy data in seconds — no login, no stress.</p>
          <Button
            onClick={() => navigate('/buy-data')}
            size="md"
            className="mt-4 w-full sm:w-auto"
            iconRight={<ArrowRightIcon className="h-5 w-5" />}
          >
            Buy Data
          </Button>
        </div>
      </div>

      {/* Become an Agent — full-width banner */}
      <Link
        to="/agent"
        className="relative mt-4 flex items-center gap-4 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/40"
      >
        <div className="glow-mesh pointer-events-none absolute inset-0" />
        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
          <BriefcaseIcon className="h-6 w-6" />
        </span>
        <div className="relative min-w-0 flex-1">
          <p className="font-display text-base font-bold">
            {store?.storeName ? 'Manage your store' : 'Become an Agent'}
          </p>
          <p className="truncate text-sm text-muted">
            {store?.storeName ? store.storeName : `Open your own data store from ${formatCedis(60)}`}
          </p>
        </div>
        <ChevronRightIcon className="relative h-5 w-5 shrink-0 text-muted" />
      </Link>

      {/* Buy Mobile Data — network cards with logos */}
      <section className="mt-7">
        <h2 className="text-lg font-bold">Buy Mobile Data</h2>
        <p className="mb-3 mt-0.5 text-sm text-muted">Top up any Ghana network instantly</p>
        <div className="grid grid-cols-2 gap-3">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(`/buy-data?network=${n.id}`)}
              aria-label={`Buy ${n.label} data`}
              className="relative flex aspect-[16/11] flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl p-3 shadow-card transition-transform active:scale-[0.98]"
              style={{ background: n.gradient, color: n.ink }}
            >
              {n.badge && (
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
                  {n.badge}
                </span>
              )}
              <NetworkLogo network={n} />
              <span className="text-sm font-semibold opacity-90">
                {pricesLoading
                  ? 'From ₵…'
                  : prices[n.id] != null
                    ? `From ${formatCedis(prices[n.id])}`
                    : 'Tap to buy'}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent orders */}
      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent orders</h2>
          {recent.length > 0 && (
            <Link to="/history" className="text-sm font-semibold text-brand">
              View all
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-7 text-center">
            <ReceiptIcon className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 text-sm text-muted">No orders yet — your purchases will show up here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((o) => {
              const net = getNetwork(o.network)
              return (
                <Link
                  key={o.id}
                  to={o.reference ? `/order-status?reference=${encodeURIComponent(o.reference)}` : '/history'}
                  className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3 transition-colors hover:border-brand/40"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-xs font-bold"
                    style={{ background: net.gradient, color: net.ink }}
                  >
                    {net.abbr}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {o.volume} · {net.label}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(o.createdAt).toLocaleDateString('en-GH', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-bold tnum text-brand">{formatCedis(o.amount)}</span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <p className="mt-9 flex items-center justify-center gap-1.5 text-xs text-muted">
        <ShieldIcon className="h-4 w-4 text-brand" /> Secured by Paystack · Made in Ghana 🇬🇭
      </p>
    </Page>
  )
}
