import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'
import { ShieldIcon } from './icons.jsx'

const cols = [
  {
    title: 'Product',
    links: [
      { to: '/buy-data', label: 'Buy Data' },
      { to: '/order-status', label: 'Track an Order' },
      { to: '/about', label: 'About GhEasy' },
    ],
  },
  {
    title: 'Networks',
    links: [
      { to: '/buy-data?network=mtn', label: 'MTN Data' },
      { to: '/buy-data?network=telecel', label: 'Telecel Data' },
      { to: '/buy-data?network=airteltigo', label: 'AirtelTigo Data' },
    ],
  },
  {
    title: 'Coming soon',
    links: [
      { to: '/about', label: 'Airtime top-up' },
      { to: '/about', label: 'Electricity (ECG)' },
      { to: '/about', label: 'TV & water bills' },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-24 hidden border-t border-border bg-surface md:block">
      <div className="wrap grid grid-cols-2 gap-10 py-16 lg:grid-cols-5">
        <div className="col-span-2 max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Pay anything. Anytime. Instant data bundles for every Ghanaian network — no app
            download, no login, no stress.
          </p>
          <span className="mt-5 inline-flex chip">🇬🇭 Proudly built in Ghana</span>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold text-fg">{c.title}</h4>
            <ul className="mt-4 space-y-3">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted transition-colors hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="wrap flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted sm:flex-row">
          <span>© {year} GhEasy. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldIcon className="h-4 w-4 text-brand" />
            Payments secured by Paystack
          </span>
        </div>
      </div>
    </footer>
  )
}
