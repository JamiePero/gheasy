import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { AGENT_BASE_PRICE, AGENT_FEE, firstName, formatCedis, isValidGhPhone } from '../lib/format.js'
import { getAgentStore, saveAgentStore } from '../lib/store.js'
import { track } from '../lib/analytics.js'
import {
  ArrowLeftIcon,
  BoltIcon,
  BriefcaseIcon,
  ChartIcon,
  CheckIcon,
  HeadsetIcon,
  ShieldIcon,
  WalletIcon,
} from '../components/icons.jsx'

// TODO: replace with the real agent support WhatsApp number.
const WHATSAPP = '233000000000'

const benefits = [
  { Icon: WalletIcon, title: 'Custom pricing', text: 'Set your own price per GB and keep the margin on every sale.' },
  { Icon: BoltIcon, title: 'Instant delivery', text: 'Bundles drop in seconds, so your customers never wait.' },
  { Icon: ChartIcon, title: 'Earn commission', text: 'The more you sell, the more you make. No limits.' },
  { Icon: HeadsetIcon, title: 'Priority support', text: 'A dedicated agent line whenever you need a hand.' },
]

const inputCls = (err) =>
  `w-full rounded-2xl border bg-card px-3.5 py-3 text-[15px] font-medium text-fg outline-none transition-colors placeholder:font-normal placeholder:text-muted/50 ${
    err ? 'border-red-400' : 'border-border focus:border-brand'
  }`

function Field({ label, value, onChange, placeholder, error, hint, ...rest }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} className={inputCls(!!error)} {...rest} />
      {error ? (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

function StoreSummary({ store }) {
  const margin = Math.max(0, Number(store.price) - AGENT_BASE_PRICE)
  return (
    <div className="rounded-3xl border border-brand/40 bg-brand/[0.07] p-6 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-white">
        <CheckIcon className="h-7 w-7" strokeWidth={3} />
      </span>
      <p className="mt-4 font-display text-xl font-bold">{store.storeName}</p>
      <p className="text-sm text-muted">Your store is ready to go live</p>

      <dl className="mt-5 space-y-2 rounded-2xl border border-border bg-card p-4 text-left text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Owner</dt>
          <dd className="font-semibold">{store.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Your price / GB</dt>
          <dd className="font-semibold tnum">{formatCedis(store.price)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">You earn / GB</dt>
          <dd className="font-bold tnum text-brand">{formatCedis(margin)}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-2xl border border-dashed border-brand/50 p-4">
        <p className="text-sm font-semibold">One-time activation fee</p>
        <p className="font-display text-3xl font-bold tnum text-brand">{formatCedis(AGENT_FEE)}</p>
        <p className="mt-1 text-xs text-muted">Pay once to take your store live — no monthly charges.</p>
      </div>

      <Button
        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
          `Hi, I want to activate my easy store "${store.storeName}" (one-time ${formatCedis(AGENT_FEE)} fee).`,
        )}`}
        className="mt-5 w-full"
        icon={<HeadsetIcon className="h-5 w-5" />}
      >
        Pay {formatCedis(AGENT_FEE)} to activate
      </Button>
      <p className="mt-3 text-xs text-muted">We’ll confirm payment and switch your store on right away.</p>
    </div>
  )
}

export default function Agent() {
  const navigate = useNavigate()
  const [created, setCreated] = useState(() => getAgentStore())
  const [form, setForm] = useState({ storeName: '', name: '', phone: '', price: '4.80' })
  const [tried, setTried] = useState(false)

  const priceNum = parseFloat(form.price)
  const phoneOk = isValidGhPhone(form.phone)
  const priceOk = Number.isFinite(priceNum) && priceNum > AGENT_BASE_PRICE
  const valid = form.storeName.trim() && form.name.trim() && phoneOk && priceOk
  const margin = priceOk ? priceNum - AGENT_BASE_PRICE : 0
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const create = (e) => {
    e.preventDefault()
    setTried(true)
    if (!valid) return
    const record = {
      storeName: form.storeName.trim(),
      name: form.name.trim(),
      phone: form.phone,
      price: priceNum,
      status: 'pending_fee',
      createdAt: Date.now(),
    }
    saveAgentStore(record)
    track('agent_store_created', { store: record.storeName, price: priceNum })
    setCreated(record)
  }

  return (
    <Page className="wrap-app pb-12 pt-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="glow-mesh pointer-events-none absolute inset-0" />
        <div className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
            <BriefcaseIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Become an Agent</h1>
          <p className="mt-1 text-sm text-muted">
            {created
              ? `Welcome back, ${firstName(created.name)} — here’s your store.`
              : 'Open your own data store, set your prices, and earn on every sale.'}
          </p>
        </div>
      </div>

      {created ? (
        <div className="mt-5">
          <StoreSummary store={created} />
          <button
            onClick={() => setCreated(null)}
            className="mt-4 w-full text-center text-sm font-medium text-muted transition-colors hover:text-brand"
          >
            Edit store details
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-2xl border border-border bg-card p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
                  <b.Icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-bold">{b.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{b.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={create} className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
            <div>
              <h2 className="text-lg font-bold">Create your store</h2>
              <p className="mt-0.5 text-sm text-muted">No application — set up in under a minute.</p>
            </div>

            <Field
              label="Store name"
              value={form.storeName}
              onChange={set('storeName')}
              placeholder="e.g. Jamie's Data Hub"
              error={tried && !form.storeName.trim() ? 'Required' : ''}
            />
            <Field
              label="Your name"
              value={form.name}
              onChange={set('name')}
              placeholder="Full name"
              error={tried && !form.name.trim() ? 'Required' : ''}
            />
            <div>
              <label className="mb-2 block text-sm font-semibold">Phone number</label>
              <input
                value={form.phone}
                onChange={set('phone')}
                inputMode="numeric"
                placeholder="024 123 4567"
                className={inputCls(tried && !phoneOk)}
              />
              {tried && !phoneOk && <p className="mt-1.5 text-xs text-red-500">Enter a valid Ghana number.</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold">Your price per 1GB (GHS)</label>
              <input
                value={form.price}
                onChange={set('price')}
                inputMode="decimal"
                placeholder="4.80"
                className={inputCls(tried && !priceOk)}
              />
              {tried && !priceOk ? (
                <p className="mt-1.5 text-xs text-red-500">
                  Price must be above {formatCedis(AGENT_BASE_PRICE)}.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  Floor is {formatCedis(AGENT_BASE_PRICE)} — you earn{' '}
                  <span className="font-semibold text-brand">{formatCedis(margin)}</span> per GB sold.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-dashed border-brand/50 bg-brand/[0.05] p-4">
              <div>
                <p className="text-sm font-semibold">One-time setup fee</p>
                <p className="text-xs text-muted">Pay once — your store is yours for good.</p>
              </div>
              <p className="font-display text-2xl font-bold tnum text-brand">{formatCedis(AGENT_FEE)}</p>
            </div>

            <Button type="submit" size="lg" className="w-full">
              Create my store — {formatCedis(AGENT_FEE)}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <ShieldIcon className="h-4 w-4 shrink-0 text-brand" /> Secured by Paystack. No monthly fees.
            </p>
          </form>
        </>
      )}
    </Page>
  )
}
