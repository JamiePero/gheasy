import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import { NetworkBadge } from '../components/NetworkPicker.jsx'
import { NETWORKS } from '../lib/format.js'
import {
  ArrowRightIcon,
  BoltIcon,
  GlobeIcon,
  ShieldIcon,
  SparkleIcon,
  StarIcon,
  WalletIcon,
} from '../components/icons.jsx'

const values = [
  { Icon: BoltIcon, title: 'Instant', text: 'Bundles are delivered automatically in seconds — no waiting, no manual processing.' },
  { Icon: ShieldIcon, title: 'Secure', text: 'Payments run on Paystack with bank-grade encryption. We never store your card details.' },
  { Icon: GlobeIcon, title: 'Open to all', text: 'No accounts, no passwords, no downloads. easy works for everyone, on any phone.' },
  { Icon: WalletIcon, title: 'Fair', text: 'Transparent pricing with no hidden charges. The price you see is the price you pay.' },
]

const roadmap = [
  { label: 'Data bundles', status: 'Live now', live: true },
  { label: 'Airtime top-up', status: 'Coming soon' },
  { label: 'Electricity (ECG / NEDCo)', status: 'Coming soon' },
  { label: 'Water (Ghana Water)', status: 'Coming soon' },
  { label: 'TV (DStv, GOtv, StarTimes)', status: 'Coming soon' },
]

export default function About() {
  return (
    <Page>
      <Seo
        title="About GhEasy — Ghana's Simplest Data Bundle Platform"
        description="GhEasy makes buying MTN, Telecel and AirtelTigo data in Ghana fast, safe, and login-free. Learn who we are and why we built this."
      />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="glow-mesh pointer-events-none absolute inset-0 -z-10" />
        <div className="wrap max-w-3xl py-14 text-center md:py-20">
          <span className="inline-flex chip">
            <StarIcon className="h-3.5 w-3.5 text-brand" fill="currentColor" stroke="none" /> About easy
          </span>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            Paying for the essentials should be <span className="text-gradient">easy</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">
            easy is a Ghanaian payments platform on a simple mission: make everyday top-ups and
            bills effortless. We’re starting with data bundles — pick, pay, done.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="wrap max-w-3xl">
        <div className="card p-7 shadow-card sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight">Why we built easy</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted">
            <p>
              Buying data in Ghana often means juggling USSD codes, app logins, or middlemen. We
              thought it should take seconds — not menus and passwords.
            </p>
            <p>
              So we built easy: a clean, fast web app that delivers MTN, Telecel and AirtelTigo
              bundles instantly, with payments secured by Paystack. No sign-up. No app store. Just
              open it, choose a bundle, and pay with Mobile Money or card.
            </p>
            <p>
              Data is only the beginning. Our goal is to be the easiest way to pay for everything
              that keeps life running in Ghana.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="wrap max-w-4xl py-16">
        <div className="text-center">
          <span className="chip">What we stand for</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">Simple by design</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {values.map((v) => (
            <div key={v.title} className="card flex gap-4 p-6 shadow-card">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                <v.Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{v.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{v.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Networks + roadmap */}
      <section className="wrap max-w-4xl grid gap-6 pb-4 lg:grid-cols-2">
        <div className="card p-7 shadow-card">
          <h3 className="text-lg font-bold">Networks we support</h3>
          <p className="mt-1 text-sm text-muted">Live bundle prices for all three major networks.</p>
          <ul className="mt-5 space-y-3">
            {NETWORKS.map((n) => (
              <li key={n.id} className="flex items-center gap-3">
                <NetworkBadge network={n} size="sm" />
                <span className="font-semibold">{n.label}</span>
                <span className="text-sm text-muted">— {n.blurb}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-7 shadow-card">
          <h3 className="text-lg font-bold">On our roadmap</h3>
          <p className="mt-1 text-sm text-muted">More ways to pay anything, anytime.</p>
          <ul className="mt-5 space-y-3">
            {roadmap.map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-fg">{r.label}</span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    r.live ? 'bg-brand/10 text-brand' : 'bg-surface text-muted'
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="wrap max-w-4xl py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-400 via-brand to-brand-600 p-8 text-center shadow-glow sm:p-12">
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
          <SparkleIcon className="mx-auto h-8 w-8 text-white/90" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready when you are
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/90">
            Your next bundle is moments away. Made with care in Ghana 🇬🇭
          </p>
          <Button
            to="/buy-data"
            size="lg"
            className="mx-auto mt-8 bg-white !text-brand-700 shadow-none hover:bg-white/90"
            iconRight={<ArrowRightIcon className="h-5 w-5" />}
          >
            Buy Data
          </Button>
        </div>
      </section>
    </Page>
  )
}
