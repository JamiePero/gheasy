import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { registerCustomer } from '../lib/api.js'
import { friendlyError } from '../lib/errors.js'
import { AGENT_FEE, formatCedis, isValidGhPhone, normalizePhone } from '../lib/format.js'
import { saveCustomerSession } from '../lib/store.js'
import { track } from '../lib/analytics.js'
import { AlertIcon, ArrowLeftIcon, GiftIcon } from '../components/icons.jsx'

const inputCls = (err) =>
  `w-full rounded-2xl border bg-card px-3.5 py-3 text-[15px] font-medium text-fg outline-none transition-colors placeholder:font-normal placeholder:text-muted/50 ${
    err ? 'border-red-400' : 'border-border focus:border-brand'
  }`

export default function CustomerRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', pin: '' })
  const [tried, setTried] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const nameOk = form.name.trim().length >= 2
  const phoneOk = isValidGhPhone(form.phone)
  const pinOk = /^\d{4}$/.test(form.pin)
  const valid = nameOk && phoneOk && pinOk

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: k === 'pin' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setTried(true)
    setError('')
    if (!valid) return
    setLoading(true)
    try {
      const data = await registerCustomer({ name: form.name.trim(), phone: normalizePhone(form.phone), pin: form.pin })
      saveCustomerSession({ token: data.token, customer: data.customer })
      track('customer_register', {})
      navigate('/account')
    } catch (err) {
      setError(friendlyError(err, 'Could not create your account. Please try again.'))
      setLoading(false)
    }
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
            <GiftIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Create your free account</h1>
          <p className="mt-1 text-sm text-muted">Get your referral code, earn points, and track your orders — no fee.</p>
          <p className="mt-4 rounded-xl bg-brand/10 p-3 text-xs leading-relaxed text-fg/80">
            You can still buy data without an account — an account just unlocks referrals and rewards.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <div>
          <label className="mb-2 block text-sm font-semibold">Your name</label>
          <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="e.g. Ama Mensah" className={inputCls(tried && !nameOk)} />
          {tried && !nameOk && <p className="mt-1.5 text-xs text-red-500">Enter your name.</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">Phone number</label>
          <input value={form.phone} onChange={set('phone')} inputMode="numeric" autoComplete="tel" placeholder="024 123 4567" className={inputCls(tried && !phoneOk)} />
          {tried && !phoneOk && <p className="mt-1.5 text-xs text-red-500">Enter a valid Ghana number.</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">Choose a 4-digit PIN</label>
          <input value={form.pin} onChange={set('pin')} inputMode="numeric" type="password" autoComplete="new-password" placeholder="••••" maxLength={4} className={`${inputCls(tried && !pinOk)} tracking-[0.5em]`} />
          {tried && !pinOk && <p className="mt-1.5 text-xs text-red-500">PIN must be 4 digits.</p>}
        </div>

        {error && (
          <p className="flex items-start gap-1.5 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-500">
            <AlertIcon className="mt-px h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">Create free account</Button>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand">Log in</Link>
        </p>
        <p className="text-center text-xs text-muted">
          Want your own store instead?{' '}
          <Link to="/agent" className="font-semibold text-brand">Become an agent ({formatCedis(AGENT_FEE)})</Link>
        </p>
      </form>
    </Page>
  )
}
