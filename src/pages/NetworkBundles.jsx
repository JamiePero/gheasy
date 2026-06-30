import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import { SITE_URL } from '../config.js'
import { ArrowRightIcon, CheckIcon } from '../components/icons.jsx'

// Static, crawlable content per network. Sample bundles render in the initial
// HTML for SEO; live prices and the full list are shown at checkout.
const NETWORKS = {
  mtn: {
    label: 'MTN',
    code: '*138#',
    grad: 'linear-gradient(135deg,#ffcc00,#ffb300)',
    ink: '#1a1a00',
    title: 'Buy MTN Data Bundles Ghana | Cheap MTN Bundles | easy',
    description:
      'Buy cheap MTN Ghana data bundles via MoMo. Daily, weekly & monthly plans available. No login needed. Instant delivery. From GH₵1.',
    intro:
      'Buy MTN data bundles instantly on GhEasy. No account, no USSD menu — just pick your plan, pay with MoMo, and get connected. We support all MTN prepaid bundle types including daily, weekly, monthly, and social media bundles.',
    bundles: [
      { name: 'Daily Starter', data: '500MB', validity: '24 hrs', price: 'GH₵2' },
      { name: 'Daily Value', data: '3GB', validity: '24 hrs', price: 'GH₵10' },
      { name: 'Weekly', data: '5GB', validity: '7 days', price: 'GH₵20' },
      { name: 'Monthly', data: '10GB', validity: '30 days', price: 'GH₵50' },
    ],
  },
  telecel: {
    label: 'Telecel',
    code: '*126#',
    grad: 'linear-gradient(135deg,#e2231a,#b71c14)',
    ink: '#fff',
    title: 'Buy Telecel Data Bundles Ghana | easy',
    description:
      'Buy cheap Telecel Ghana data bundles via MoMo. Daily, weekly & monthly plans. No login needed. Instant delivery. From GH₵1.',
    intro:
      'Buy Telecel data bundles instantly on GhEasy. No account and no USSD menu — pick your plan, pay with MoMo, and get connected in seconds. We support Telecel daily, weekly and monthly data bundles.',
    bundles: [
      { name: 'Daily', data: '1GB', validity: '24 hrs', price: 'GH₵5' },
      { name: 'Weekly', data: '5GB', validity: '7 days', price: 'GH₵22' },
      { name: 'Monthly', data: '10GB', validity: '30 days', price: 'GH₵48' },
      { name: 'Monthly Plus', data: '20GB', validity: '30 days', price: 'GH₵85' },
    ],
  },
  airteltigo: {
    label: 'AirtelTigo',
    code: '*504#',
    grad: 'linear-gradient(135deg,#0057b7,#e2231a)',
    ink: '#fff',
    title: 'Buy AirtelTigo Data Bundles Ghana | easy',
    description:
      'Buy cheap AirtelTigo Ghana data bundles via MoMo. Daily, weekly & monthly plans. No login needed. Instant delivery. From GH₵1.',
    intro:
      'Buy AirtelTigo data bundles instantly on GhEasy. No account and no USSD menu — pick your plan, pay with MoMo, and get connected in seconds. We support AirtelTigo daily, weekly and monthly data bundles.',
    bundles: [
      { name: 'Daily', data: '1GB', validity: '24 hrs', price: 'GH₵4' },
      { name: 'Weekly', data: '6GB', validity: '7 days', price: 'GH₵20' },
      { name: 'Monthly', data: '12GB', validity: '30 days', price: 'GH₵50' },
      { name: 'Monthly Plus', data: '25GB', validity: '30 days', price: 'GH₵90' },
    ],
  },
}

export default function NetworkBundles({ network }) {
  const n = NETWORKS[network]
  if (!n) return null

  // Product JSON-LD so Google can surface the bundles as rich results (GHS prices).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${n.label} Data Bundles in Ghana`,
    itemListElement: n.bundles.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: `${n.label} ${b.data} Data Bundle (${b.name})`,
        category: 'Mobile data bundle',
        brand: { '@type': 'Brand', name: n.label },
        offers: {
          '@type': 'Offer',
          price: String(b.price).replace(/[^\d.]/g, ''),
          priceCurrency: 'GHS',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/buy-data?network=${network}`,
        },
      },
    })),
  }

  return (
    <Page>
      <Seo title={n.title} description={n.description} jsonLd={jsonLd} />

      <section className="wrap max-w-3xl py-12 md:py-16">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold"
          style={{ background: n.grad, color: n.ink }}
        >
          {n.label} · Ghana
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {n.label} Data Bundles — Ghana
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">{n.intro}</p>
      </section>

      <section className="wrap max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-semibold">Bundle</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Validity</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              {n.bundles.map((b) => (
                <tr key={b.name} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium text-fg">{b.name}</td>
                  <td className="px-4 py-3 text-muted">{b.data}</td>
                  <td className="px-4 py-3 text-muted">{b.validity}</td>
                  <td className="px-4 py-3 text-right font-bold tnum text-brand">{b.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Sample plans shown — live prices and the full bundle list appear at checkout.
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
            <CheckIcon className="h-4 w-4" strokeWidth={3} />
          </span>
          <span className="text-muted">
            After purchase, dial <span className="font-mono font-semibold text-fg">{n.code}</span> to
            confirm your {n.label} data balance.
          </span>
        </div>

        <div className="my-12 text-center">
          <Button to="/buy-data" size="lg" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
            Buy {n.label} Data Now
          </Button>
        </div>
      </section>
    </Page>
  )
}
