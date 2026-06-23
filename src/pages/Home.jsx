import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import AdCarousel from '../components/AdCarousel.jsx'
import InstallSection from '../components/InstallSection.jsx'
import NetworkLogo from '../components/NetworkLogo.jsx'
import Avatar from '../components/Avatar.jsx'
import { fetchBundles } from '../lib/api.js'
import { getAccountHint, getAgentSession, getAgentStore, getOrders, getProfile } from '../lib/store.js'
import { NETWORKS, firstName, formatCedis, getNetwork } from '../lib/format.js'
import Seo from '../components/Seo.jsx'
import { BALANCE_CODES } from '../config.js'
import { markAppReady } from '../lib/appReady.js'
import {
  ArrowRightIcon,
  BoltIcon,
  BriefcaseIcon,
  ChevronRightIcon,
  DataIcon,
  GiftIcon,
  GlobeIcon,
  ReceiptIcon,
  ShieldIcon,
} from '../components/icons.jsx'

// Home-only account control: shows the signed-in account's store (detected
// cross-subdomain via getAccountHint), otherwise a general Login button. The
// Login button lives ONLY here — no other page shows it.
function AccountButton() {
  const [account, setAccount] = useState(null)
  // Client-only so the prerendered (logged-out) markup hydrates cleanly.
  useEffect(() => {
    setAccount(getAccountHint())
  }, [])

  if (account) {
    const initials =
      (account.storeName || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase() || 'A'
    return (
      <Link
        to="/dashboard"
        aria-label="Your account"
        className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-2.5"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
          {initials}
        </span>
        <span className="max-w-[90px] truncate text-sm font-semibold text-fg">
          {account.storeName || 'Account'}
        </span>
      </Link>
    )
  }

  return (
    <Link
      to="/login"
      aria-label="Log in to your account"
      className="flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/20"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="m10 17 5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
      Login
    </Link>
  )
}

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

const fromLabel = (prices, loading, id) =>
  loading ? 'From ₵…' : prices[id] != null ? `From ${formatCedis(prices[id])}` : 'Tap to buy'

// ── Desktop landing content (md and up) ────────────────────────────────────

const steps = [
  { n: '1', Icon: GlobeIcon, title: 'Pick a network', text: 'Choose MTN, Telecel or AirtelTigo — whichever line you’re topping up.' },
  { n: '2', Icon: DataIcon, title: 'Enter number & bundle', text: 'Type the recipient’s number and choose the data bundle you want.' },
  { n: '3', Icon: BoltIcon, title: 'Pay & receive instantly', text: 'Pay securely with Mobile Money or card — the bundle lands in seconds.' },
]

const trust = [
  { Icon: ShieldIcon, title: 'Secure payments via Paystack' },
  { Icon: GlobeIcon, title: 'No login required' },
  { Icon: BoltIcon, title: 'Instant delivery' },
  { Icon: DataIcon, title: 'All Ghana networks' },
]

function PhoneMockup({ prices, loading }) {
  return (
    <div className="relative w-[300px]">
      {/* green glow */}
      <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-brand/25 blur-3xl" />
      <div className="rounded-[2.7rem] border-2 border-border bg-card p-3 shadow-2xl">
        <div className="overflow-hidden rounded-[2.1rem] border border-border bg-bg">
          <div className="relative flex h-9 items-center justify-center">
            <span className="h-1.5 w-16 rounded-full bg-border" />
          </div>
          <div className="space-y-4 p-4 pb-6">
            <div>
              <p className="text-[11px] font-medium text-muted">easy</p>
              <p className="font-display text-lg font-bold">Buy Data</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NETWORKS.map((n) => (
                <div
                  key={n.id}
                  className="relative flex aspect-[16/11] flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl p-2"
                  style={{ background: n.gradient, color: n.ink }}
                >
                  {n.badge && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-black/25 px-1.5 py-0.5 text-[7px] font-bold tracking-wide text-white">
                      {n.badge}
                    </span>
                  )}
                  <span className="font-display text-sm font-bold leading-none">{n.display}</span>
                  <span className="text-[9px] font-semibold opacity-90">{fromLabel(prices, loading, n.id)}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-brand py-3 text-center text-sm font-semibold text-white shadow-glow">
              Buy Data
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { prices, loading: pricesLoading } = useNetworkFrom()
  const [recent] = useState(() => getOrders().slice(0, 3))
  const [profile] = useState(() => getProfile())
  const [store] = useState(() => getAgentStore())
  const first = firstName(profile.name)

  // Signal the splash that the home content is ready once bundle prices load.
  useEffect(() => {
    if (!pricesLoading) markAppReady()
  }, [pricesLoading])

  // Logged-in agent? Show a dashboard banner at the very top (CHANGE 3).
  const [agentSession] = useState(() => getAgentSession())
  const agent = agentSession?.agent
  const agentStoreUrl = agent ? agent.storeUrl || `https://gheasy.com/store/${agent.slug}` : ''
  const [agentCopied, setAgentCopied] = useState(false)
  const copyAgentStore = async () => {
    try {
      await navigator.clipboard.writeText(agentStoreUrl)
      setAgentCopied(true)
      setTimeout(() => setAgentCopied(false), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <Page>
      <Seo />
      {agent && (
        <div className="wrap-app pt-4">
          <div className="relative overflow-hidden rounded-3xl border border-brand/30 bg-brand/[0.06] p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">
                  Agent · {agent.agentId}
                </p>
                <p className="truncate font-display text-base font-bold">{agent.storeName}</p>
              </div>
              <Link
                to="/agent/dashboard"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white"
              >
                Dashboard <ChevronRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-3 flex items-stretch gap-3">
              <div className="flex-1 rounded-2xl border border-border bg-card p-3">
                <p className="text-[11px] text-muted">Earnings</p>
                <p className="font-display text-lg font-bold tnum text-brand">
                  {formatCedis(agent.earningsBalance || 0)}
                </p>
              </div>
              <button
                onClick={copyAgentStore}
                className="flex-1 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-brand/40"
              >
                <p className="text-[11px] text-muted">{agentCopied ? 'Copied!' : 'Store link · tap to copy'}</p>
                <p className="truncate text-xs font-medium">{agentStoreUrl}</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MOBILE (< md) — unchanged ════════════════ */}
      <div className="wrap-app pb-10 md:hidden">
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
          <div className="flex items-center gap-2">
            <Link
              to="/refer"
              aria-label="Refer a friend"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-brand transition-colors hover:border-brand/50"
            >
              <GiftIcon className="h-5 w-5" />
            </Link>
            <AccountButton />
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

        {/* Trust bar */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 font-medium">
            <BoltIcon className="h-4 w-4 shrink-0 text-brand" /> Instant delivery
          </span>
          <span className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 font-medium">
            <ShieldIcon className="h-4 w-4 shrink-0 text-brand" /> Secure MoMo
          </span>
          <span className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 font-medium">
            <GlobeIcon className="h-4 w-4 shrink-0 text-brand" /> All networks
          </span>
          <span className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 font-medium">
            <DataIcon className="h-4 w-4 shrink-0 text-brand" /> 24/7 available
          </span>
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

        {/* Install the app */}
        <div className="mt-7">
          <InstallSection />
        </div>

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
                <span className="text-sm font-semibold opacity-90">{fromLabel(prices, pricesLoading, n.id)}</span>
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

        {/* Check your balance */}
        <section className="mt-7 rounded-3xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-sm font-bold">Check your data balance</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {BALANCE_CODES.map((b) => (
              <li key={b.network} className="flex items-center justify-between">
                <span className="text-muted">{b.network}</span>
                <span className="font-mono font-semibold">Dial {b.code}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-9 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldIcon className="h-4 w-4 text-brand" /> Secured by Paystack · Made in Ghana 🇬🇭
        </p>
      </div>

      {/* ════════════════ DESKTOP LANDING (md and up) ════════════════ */}
      <div className="hidden md:block">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="glow-mesh pointer-events-none absolute inset-0 -z-10" />
          <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
          <div className="wrap grid grid-cols-2 items-center gap-10 py-20 lg:gap-16 lg:py-28">
            {/* Left column */}
            <div>
              <span className="inline-flex chip">
                <BoltIcon className="h-3.5 w-3.5 text-brand" /> Instant data delivery in Ghana
              </span>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight lg:text-6xl">
                Pay anything.
                <br />
                <RotatingWord />
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
                Buy MTN, Telecel &amp; AirtelTigo bundles in seconds. No app, no login — just pick, pay, done.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Button to="/buy-data" size="lg" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
                  Buy Data
                </Button>
                <Button to="/order-status" variant="outline" size="lg">
                  Track Order
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldIcon className="h-4 w-4 text-brand" /> Secure
                </span>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <BoltIcon className="h-4 w-4 text-brand" /> Instant
                </span>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <GlobeIcon className="h-4 w-4 text-brand" /> No login
                </span>
              </div>
            </div>

            {/* Right column — phone mockup */}
            <div className="flex justify-center">
              <PhoneMockup prices={prices} loading={pricesLoading} />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-t border-border bg-surface/40">
          <div className="wrap py-20">
            <div className="text-center">
              <h2 className="font-display text-4xl font-bold tracking-tight">How it works</h2>
              <p className="mt-3 text-muted">Three steps to get back online.</p>
            </div>
            <div className="mt-14 grid grid-cols-3 gap-8">
              {steps.map((s) => (
                <div key={s.n} className="rounded-3xl border border-border bg-card p-8 shadow-card">
                  <span className="font-display text-5xl font-bold leading-none text-brand">{s.n}</span>
                  <div className="mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                    <s.Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NETWORKS */}
        <section className="wrap py-20">
          <div className="text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight">Networks we support</h2>
            <p className="mt-3 text-muted">Live prices, instant delivery — every major network.</p>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-3 gap-6">
            {NETWORKS.slice(0, 3).map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(`/buy-data?network=${n.id}`)}
                aria-label={`Buy ${n.label} data`}
                className="group relative flex flex-col items-center gap-4 overflow-hidden rounded-3xl p-8 shadow-card transition-transform hover:-translate-y-1"
                style={{ background: n.gradient, color: n.ink }}
              >
                <NetworkLogo network={n} />
                <div className="text-center">
                  <p className="text-lg font-bold">{n.label}</p>
                  <p className="text-sm font-semibold opacity-90">{fromLabel(prices, pricesLoading, n.id)}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* STATS / TRUST */}
        <section className="border-t border-border bg-surface/40">
          <div className="wrap grid grid-cols-4 gap-6 py-16">
            {trust.map((t) => (
              <div key={t.title} className="flex flex-col items-center gap-3 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <t.Icon className="h-6 w-6" />
                </span>
                <p className="max-w-[12rem] font-semibold leading-snug">{t.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CHECK BALANCE */}
        <section className="wrap py-16">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-card p-8 shadow-card">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold tracking-tight">Check your data balance</h2>
              <p className="mt-2 text-sm text-muted">Dial the code for your network anytime after purchase.</p>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {BALANCE_CODES.map((b) => (
                <div key={b.network} className="rounded-2xl border border-border bg-surface p-5 text-center">
                  <p className="text-sm text-muted">{b.network}</p>
                  <p className="mt-1 font-display text-xl font-bold">{b.code}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BECOME AN AGENT */}
        <section className="wrap py-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-10 text-center shadow-card">
            <div className="glow-mesh pointer-events-none absolute inset-0" />
            <div className="relative mx-auto max-w-xl">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
                <BriefcaseIcon className="h-7 w-7" />
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight">Become an Agent</h2>
              <p className="mt-3 text-muted">
                Open your own data store, set your own prices, and earn on every sale. One-time setup
                from {formatCedis(60)}.
              </p>
              <div className="mt-7 flex items-center justify-center gap-3">
                <Button to="/agent" size="lg" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
                  Become an Agent
                </Button>
                <Button to="/refer" variant="outline" size="lg">
                  Refer &amp; earn
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Page>
  )
}
