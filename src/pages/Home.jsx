import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import AdCarousel from '../components/AdCarousel.jsx'
import { LogoMark } from '../components/Logo.jsx'
import { fetchBundles } from '../lib/api.js'
import { getOrders } from '../lib/store.js'
import { NETWORKS, formatCedis, getNetwork } from '../lib/format.js'
import {
  ArrowRightIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  DataIcon,
  GiftIcon,
  ReceiptIcon,
  ShieldIcon,
} from '../components/icons.jsx'

const quickActions = [
  { to: '/buy-data', label: 'Buy Data', Icon: DataIcon },
  { to: '/history', label: 'History', Icon: ReceiptIcon },
  { to: '/refer', label: 'Refer & Earn', Icon: GiftIcon },
  { to: '/agent', label: 'Become Agent', Icon: BriefcaseIcon },
]

// Cheapest bundle per network → "From ₵X"
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
  const { prices, loading } = useNetworkFrom()
  const [recent] = useState(() => getOrders().slice(0, 3))

  return (
    <Page className="wrap-app pb-10">
      {/* Greeting header */}
      <header className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <LogoMark className="h-11 w-11" />
          <div>
            <p className="font-display text-lg font-bold leading-tight">Hi there 👋</p>
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

      {/* Quick-buy hero card */}
      <div className="relative mt-5 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="glow-mesh pointer-events-none absolute inset-0" />
        <div className="relative">
          <p className="font-display text-2xl font-bold leading-tight">
            Pay anything. <span className="text-gradient">Anytime.</span>
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

      {/* Quick actions */}
      <section className="mt-7">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Quick actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-brand/40"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand">
                <a.Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Buy Mobile Data — networks */}
      <section className="mt-7">
        <div className="flex items-center gap-2">
          <DataIcon className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold">Buy Mobile Data</h2>
        </div>
        <p className="mb-3 mt-0.5 text-sm text-muted">Top up any Ghana network instantly</p>
        <div className="grid grid-cols-2 gap-3">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(`/buy-data?network=${n.id}`)}
              className="relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-3xl p-4 text-left shadow-card transition-transform active:scale-[0.98]"
              style={{ background: n.gradient, color: n.ink }}
            >
              <span className="font-display text-2xl font-bold">{n.display}</span>
              <span className="text-sm font-semibold opacity-90">
                {loading
                  ? 'From ₵—'
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
