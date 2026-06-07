import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { NETWORKS, isValidGhPhone } from '../lib/format.js'
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
  { Icon: WalletIcon, title: 'Wholesale prices', text: 'Buy at agent rates and keep the margin on every sale.' },
  { Icon: BoltIcon, title: 'Instant delivery', text: 'Bundles drop in seconds, so your customers never wait.' },
  { Icon: ChartIcon, title: 'Earn commission', text: 'The more you sell, the more you make. Simple as that.' },
  { Icon: HeadsetIcon, title: 'Priority support', text: 'A dedicated agent line whenever you need a hand.' },
]

const steps = [
  'Register your details below',
  'We verify and activate your agent account',
  'Start selling data and earning commission',
]

const inputCls = (err) =>
  `w-full rounded-2xl border bg-card px-3.5 py-3 text-[15px] font-medium text-fg outline-none transition-colors placeholder:font-normal placeholder:text-muted/50 ${
    err ? 'border-red-400' : 'border-border focus:border-brand'
  }`

function Field({ label, value, onChange, placeholder, error, ...rest }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} className={inputCls(!!error)} {...rest} />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function Agent() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', area: '', network: 'mtn' })
  const [tried, setTried] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const phoneOk = isValidGhPhone(form.phone)
  const valid = form.name.trim() && phoneOk && form.area.trim()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    setTried(true)
    if (!valid) return
    track('agent_signup', { network: form.network, area: form.area })
    setSubmitted(true)
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
          <p className="mt-1 text-sm text-muted">Resell data with easy and earn on every single sale.</p>
        </div>
      </div>

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

      <h2 className="mt-7 text-sm font-bold">How it works</h2>
      <ol className="mt-3 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-0.5 text-sm text-muted">{s}</span>
          </li>
        ))}
      </ol>

      {submitted ? (
        <div className="mt-7 rounded-3xl border border-brand/40 bg-brand/[0.07] p-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-white">
            <CheckIcon className="h-7 w-7" strokeWidth={3} />
          </span>
          <p className="mt-4 font-bold">Application received 🎉</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            Thanks {form.name.trim().split(' ')[0]}! Our team will reach out shortly to activate your agent
            account.
          </p>
          <Button
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi, I just applied to become an easy agent.')}`}
            className="mt-5"
            icon={<HeadsetIcon className="h-5 w-5" />}
          >
            Chat with us on WhatsApp
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-7 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Apply now</h2>
          <Field
            label="Full name"
            value={form.name}
            onChange={set('name')}
            placeholder="Your full name"
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
          <Field
            label="Area / town"
            value={form.area}
            onChange={set('area')}
            placeholder="e.g. Sunyani"
            error={tried && !form.area.trim() ? 'Required' : ''}
          />
          <div>
            <label className="mb-2 block text-sm font-semibold">Main network</label>
            <select value={form.network} onChange={set('network')} className={inputCls(false)}>
              {NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
              <option value="all">All networks</option>
            </select>
          </div>
          <Button type="submit" size="lg" className="w-full">
            Submit application
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
            <ShieldIcon className="h-4 w-4 shrink-0 text-brand" /> We’ll only use your details to set up your account.
          </p>
        </form>
      )}
    </Page>
  )
}
