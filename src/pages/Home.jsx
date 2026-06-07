import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import AdCarousel from '../components/AdCarousel.jsx'
import NetworkPicker, { NetworkBadge } from '../components/NetworkPicker.jsx'
import { NETWORKS, formatCedis } from '../lib/format.js'
import {
  ArrowRightIcon,
  BoltIcon,
  ChevronRightIcon,
  ClockIcon,
  GlobeIcon,
  HeartIcon,
  PhoneIcon,
  ShieldIcon,
  SparkleIcon,
  StarIcon,
  WalletIcon,
} from '../components/icons.jsx'

const stats = [
  { value: '120k+', label: 'Bundles delivered' },
  { value: '< 30s', label: 'Average delivery' },
  { value: '3', label: 'Networks supported' },
  { value: '99.9%', label: 'Success rate' },
]

const steps = [
  { n: '01', Icon: GlobeIcon, title: 'Pick your network', text: 'MTN, Telecel or AirtelTigo — choose the network and the bundle that fits.' },
  { n: '02', Icon: PhoneIcon, title: 'Enter the number', text: 'Top up your own line or send data to anyone in Ghana. No account needed.' },
  { n: '03', Icon: WalletIcon, title: 'Pay & you’re done', text: 'Pay securely with Mobile Money or card. Data lands in seconds.' },
]

const features = [
  { Icon: BoltIcon, title: 'Instant delivery', text: 'Bundles arrive in seconds, not minutes. Automated end-to-end.' },
  { Icon: ShieldIcon, title: 'Bank-grade security', text: 'Every payment is processed and secured by Paystack.' },
  { Icon: GlobeIcon, title: 'No login, ever', text: 'No sign-ups, no passwords. Open, pay, close. That simple.' },
  { Icon: WalletIcon, title: 'Fair, honest prices', text: 'Clear pricing with no hidden fees. What you see is what you pay.' },
  { Icon: ClockIcon, title: 'Available 24/7', text: 'Top up at 3pm or 3am. GhEasy never sleeps.' },
  { Icon: PhoneIcon, title: 'Works on any phone', text: 'A fast web app — nothing to download or install.' },
]

const testimonials = [
  { quote: 'Bought 10GB for my mum in the village and it landed before I hung up the call. Unbelievably fast.', name: 'Ama Boateng', location: 'Accra', color: '#22C55E' },
  { quote: 'No app, no stress. I just open GhEasy, pay with MoMo and I’m back online. This is how it should be.', name: 'Kwesi Mensah', location: 'Kumasi', color: '#FFD700' },
  { quote: 'I top up data for my whole shop here. Prices are fair and it has never failed me once.', name: 'Efua Sarpong', location: 'Takoradi', color: '#CC0000' },
]

function HeroPhone() {
  const demo = [
    { v: '2GB', p: 9.7 },
    { v: '5GB', p: 22.8 },
  ]
  return (
    <div className="relative mx-auto w-[290px] animate-float">
      <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-brand/20 blur-3xl" />
      <div className="rounded-[2.7rem] border border-border bg-card p-2.5 shadow-2xl">
        <div className="overflow-hidden rounded-[2.1rem] border border-border bg-bg">
          <div className="relative flex h-9 items-center justify-center">
            <span className="h-1.5 w-16 rounded-full bg-border" />
          </div>
          <div className="space-y-4 p-4 pb-6">
            <div>
              <p className="text-[11px] font-medium text-muted">GhEasy</p>
              <p className="font-display text-lg font-bold">Buy Data</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {NETWORKS.map((n) => (
                <div
                  key={n.id}
                  className="flex flex-col items-center gap-1.5 rounded-2xl p-2"
                  style={{ background: n.gradient, color: n.ink }}
                >
                  <span className="font-display text-xs font-bold">{n.display}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {demo.map((d, i) => (
                <div
                  key={d.v}
                  className={`flex items-center justify-between rounded-2xl border p-3 ${
                    i === 1 ? 'border-brand bg-brand/[0.08] ring-1 ring-brand' : 'border-border'
                  }`}
                >
                  <span className="font-display text-xl font-bold">{d.v}</span>
                  <span className="text-sm font-bold tnum" style={{ color: '#FFD700' }}>
                    {formatCedis(d.p)}
                  </span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-brand py-3 text-center text-sm font-semibold text-white shadow-glow">
              Pay {formatCedis(22.8)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [network, setNetwork] = useState('mtn')
  const navigate = useNavigate()
  const goBuy = () => navigate(`/buy-data?network=${network}`)

  return (
    <Page>
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="glow-mesh pointer-events-none absolute inset-0 -z-10" />
        <div className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />

        <div className="wrap grid items-center gap-12 pb-10 pt-10 sm:pt-16 lg:grid-cols-2 lg:gap-8 lg:pb-16 lg:pt-20">
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <span className="animate-fade-up inline-flex chip">
              <BoltIcon className="h-3.5 w-3.5 text-brand" />
              Instant data delivery in Ghana
            </span>

            <h1
              className="animate-fade-up mt-5 text-balance text-[2.7rem] font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl"
              style={{ animationDelay: '60ms' }}
            >
              Pay anything.
              <br />
              <span className="text-gradient">Anytime.</span>
            </h1>

            <p
              className="animate-fade-up mx-auto mt-5 max-w-md text-balance text-base text-muted sm:text-lg lg:mx-0"
              style={{ animationDelay: '120ms' }}
            >
              Buy MTN, Telecel &amp; AirtelTigo data bundles in seconds. No app, no login —
              just pick, pay, done.
            </p>

            <div
              className="animate-fade-up mt-7 flex flex-col gap-3 sm:flex-row lg:items-center"
              style={{ animationDelay: '180ms' }}
            >
              <Button onClick={goBuy} size="lg" className="w-full sm:w-auto" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
                Buy Data
              </Button>
              <Button to="/order-status" variant="secondary" size="lg" className="w-full sm:w-auto">
                Track an order
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-5 text-xs text-muted lg:justify-start">
              <span className="inline-flex items-center gap-1.5"><ShieldIcon className="h-4 w-4 text-brand" /> Secure</span>
              <span className="inline-flex items-center gap-1.5"><BoltIcon className="h-4 w-4 text-brand" /> Instant</span>
              <span className="inline-flex items-center gap-1.5"><GlobeIcon className="h-4 w-4 text-brand" /> No login</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <HeroPhone />
          </div>
        </div>
      </section>

      {/* ───────────────────────── AD CAROUSEL ───────────────────────── */}
      <section className="wrap pb-2">
        <AdCarousel />
      </section>

      {/* ───────────────────────── NETWORK PICKER ───────────────────────── */}
      <section className="wrap pt-8">
        <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-card p-5 shadow-card sm:p-7">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold tracking-tight">Choose your network</h2>
            <span className="text-xs text-muted">Step 1 of 2</span>
          </div>
          <NetworkPicker value={network} onChange={setNetwork} className="mt-4" />
          <Button onClick={goBuy} size="lg" className="mt-5 w-full" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
            Buy {NETWORKS.find((n) => n.id === network)?.label} Data
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldIcon className="h-4 w-4 text-brand" /> Secured by Paystack · No login required
          </p>
        </div>
      </section>

      {/* ───────── Desktop landing sections ───────── */}

      <section className="mt-16 hidden border-y border-border bg-surface md:block">
        <div className="wrap grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-fg lg:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="hidden md:block">
        <div className="wrap py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip">How it works</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">Data in three taps</h2>
            <p className="mt-3 text-muted">GhEasy strips away everything that gets between you and being back online.</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="card relative p-7 shadow-card">
                <span className="font-display text-sm font-bold text-brand">{s.n}</span>
                <div className="mt-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <s.Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hidden border-y border-border bg-surface md:block">
        <div className="wrap py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="chip">Networks</span>
              <h2 className="mt-4 text-4xl font-bold tracking-tight">Every major network</h2>
            </div>
            <p className="max-w-sm text-muted">One place for all your data. Live bundle prices pulled straight from each network.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(`/buy-data?network=${n.id}`)}
                className="card group flex items-center gap-4 p-6 text-left shadow-card transition-all hover:-translate-y-1 hover:border-brand/40"
              >
                <NetworkBadge network={n} size="lg" />
                <div className="flex-1">
                  <p className="text-lg font-bold">{n.label}</p>
                  <p className="text-sm text-muted">{n.blurb}</p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-brand" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="hidden md:block">
        <div className="wrap py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip">Why GhEasy</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">Built for how Ghana pays</h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card p-7 shadow-card transition-colors hover:border-brand/40">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                  <f.Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hidden border-t border-border bg-surface md:block">
        <div className="wrap py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip"><HeartIcon className="h-3.5 w-3.5 text-brand" /> Loved across Ghana</span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">Trusted from Accra to Tamale</h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="card flex flex-col p-7 shadow-card">
                <div className="flex gap-0.5 text-brand">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4" fill="currentColor" stroke="none" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-fg">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full font-display text-sm font-bold text-white" style={{ background: t.color }}>
                    {t.name.charAt(0)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{t.name}</span>
                    <span className="block text-xs text-muted">{t.location}, Ghana</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-400 via-brand to-brand-600 p-8 text-center shadow-glow sm:p-14">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
          <SparkleIcon className="mx-auto h-8 w-8 text-white/90" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">Pay anything. Anytime.</h2>
          <p className="mx-auto mt-3 max-w-md text-balance text-white/90">Your next data bundle is 30 seconds away. No app, no login, no stress.</p>
          <Button onClick={goBuy} size="lg" className="mx-auto mt-8 bg-white !text-brand-700 shadow-none hover:bg-white/90" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
            Buy Data now
          </Button>
        </div>
      </section>
    </Page>
  )
}
