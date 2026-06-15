import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import { BALANCE_CODES } from '../config.js'
import { ArrowRightIcon, CheckIcon } from '../components/icons.jsx'

const steps = [
  {
    n: 1,
    title: 'Pick Your Network',
    text: 'Choose MTN, Telecel, or AirtelTigo. We support all three major networks in Ghana.',
  },
  {
    n: 2,
    title: 'Choose Your Bundle',
    text: 'Browse daily, weekly, and monthly bundles. See exactly how much data you get and how long it lasts. No hidden fees.',
  },
  {
    n: 3,
    title: 'Pay via MoMo & Get Your Data',
    text: 'Enter your number, pay with Mobile Money, and your bundle is delivered in seconds. No login. No account. No stress.',
  },
]

const why = [
  'No login or registration required',
  'Instant delivery via MoMo',
  'Supports MTN, Telecel & AirtelTigo',
  'Available 24/7',
  'Safe & secure payments',
]

export default function HowItWorks() {
  return (
    <Page>
      <Seo
        title="How to Buy Data Bundles in Ghana | GhEasy"
        description="Buying data bundles on GhEasy takes 3 steps. No account, no login. Pick your network, choose a bundle, pay via MoMo. Done."
      />

      <section className="wrap max-w-3xl py-12 text-center md:py-16">
        <span className="chip">How it works</span>
        <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          How GhEasy Works
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-muted">
          Buy MTN, Telecel and AirtelTigo data bundles in three simple steps — no account needed.
        </p>
      </section>

      <section className="wrap max-w-4xl">
        <div className="grid gap-5 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card p-6 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-lg font-bold text-white">
                {s.n}
              </span>
              <h2 className="mt-4 text-lg font-bold">{`Step ${s.n}: ${s.title}`}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap max-w-3xl py-14">
        <div className="card p-7 shadow-card sm:p-9">
          <h2 className="text-2xl font-bold tracking-tight">Why GhEasy?</h2>
          <ul className="mt-5 space-y-3">
            {why.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                  <CheckIcon className="h-4 w-4" strokeWidth={3} />
                </span>
                <span className="text-[15px] font-medium text-fg">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-sm font-bold">How to check your balance after buying</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {BALANCE_CODES.map((b) => (
              <li key={b.network} className="flex items-center justify-between">
                <span className="font-medium text-fg">{b.network}</span>
                <span className="font-mono">Dial {b.code}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Button to="/buy-data" size="lg" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
            Buy Data Now
          </Button>
        </div>
      </section>
    </Page>
  )
}
