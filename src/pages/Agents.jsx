import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import { ArrowRightIcon } from '../components/icons.jsx'

const benefits = [
  { icon: '💰', title: 'Discounted prices', text: 'Get discounted bundle prices to resell at a profit.' },
  { icon: '⚡', title: 'Instant delivery', text: 'Bundles reach your customers in seconds, automatically.' },
  { icon: '📲', title: 'Simple dashboard', text: 'Manage your sales, pricing and earnings in one place.' },
  { icon: '🇬🇭', title: 'All networks', text: 'Sell MTN, Telecel & AirtelTigo bundles nationwide.' },
]

const audience = [
  'Phone repair shops',
  'MoMo agents & float traders',
  'Students looking for side income',
  'Market vendors',
  'Anyone with a customer base in Ghana',
]

export default function Agents() {
  return (
    <Page>
      <Seo
        title="Become a GhEasy Agent — Sell Data Bundles in Ghana"
        description="Earn money selling MTN, Telecel & AirtelTigo data bundles through GhEasy's agent program. Join today and start earning."
      />

      <section className="relative overflow-hidden">
        <div className="glow-mesh pointer-events-none absolute inset-0 -z-10" />
        <div className="wrap max-w-3xl py-14 text-center md:py-20">
          <span className="chip">Agent program</span>
          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Become a <span className="text-gradient">GhEasy</span> Agent
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">
            Do you have customers who need data? Turn that into income. Sell MTN, Telecel and
            AirtelTigo bundles through GhEasy and earn on every sale.
          </p>
          <Button
            to="/agent"
            size="lg"
            className="mx-auto mt-8"
            iconRight={<ArrowRightIcon className="h-5 w-5" />}
          >
            Apply to Become an Agent
          </Button>
        </div>
      </section>

      <section className="wrap max-w-4xl py-4">
        <div className="grid gap-5 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="card flex gap-4 p-6 shadow-card">
              <span className="text-2xl">{b.icon}</span>
              <div>
                <h2 className="text-lg font-bold">{b.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap max-w-3xl py-14">
        <div className="card p-7 shadow-card sm:p-9">
          <h2 className="text-2xl font-bold tracking-tight">Who is this for?</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {audience.map((a) => (
              <li key={a} className="flex items-center gap-3 text-[15px] font-medium text-fg">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {a}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Button to="/agent" size="lg" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
            Apply to Become an Agent
          </Button>
          <p className="mt-3 text-xs text-muted">
            Already an agent?{' '}
            <a href="/agent/login" className="font-semibold text-brand underline">
              Log in to your store
            </a>
          </p>
        </div>
      </section>
    </Page>
  )
}
