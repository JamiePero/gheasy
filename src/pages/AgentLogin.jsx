import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { loginAgent, resendAgentPayment } from '../lib/api.js'
import { AGENT_FEE, formatCedis, isValidGhPhone, normalizePhone } from '../lib/format.js'
import { saveAgentSession } from '../lib/store.js'
import { track } from '../lib/analytics.js'
import { AlertIcon, ArrowLeftIcon, BriefcaseIcon, ClockIcon, ShieldIcon } from '../components/icons.jsx'

const inputCls = (err) =>
  `w-full rounded-2xl border bg-card px-3.5 py-3 text-[15px] font-medium text-fg outline-none transition-colors placeholder:font-normal placeholder:text-muted/50 ${
    err ? 'border-red-400' : 'border-border focus:border-brand'
  }`

function ErrorNote({ children }) {
  if (!children) return null
  return (
    <p className="flex items-start gap-1.5 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-500">
      <AlertIcon className="mt-px h-4 w-4 shrink-0" />
      {children}
    </p>
  )
}

export default function AgentLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ phone: '', pin: '' })
  const [tried, setTried] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsPayment, setNeedsPayment] = useState(false) // 403: joining fee unpaid

  const phoneOk = isValidGhPhone(form.phone)
  const pinOk = /^\d{4}$/.test(form.pin)
  const valid = phoneOk && pinOk

  const login = async (e) => {
    e.preventDefault()
    setTried(true)
    setError('')
    setNeedsPayment(false)
    if (!valid) return
    setLoading(true)
    try {
      const data = await loginAgent({ phone: normalizePhone(form.phone), pin: form.pin })
      saveAgentSession({ token: data.token, agent: data.agent })
      track('agent_login', {})
      navigate('/dashboard')
    } catch (err) {
      if (err.status === 403 && /joining fee/i.test(err.message)) {
        setNeedsPayment(true) // registered but never paid → offer to complete payment
      } else {
        setError(err.message || 'Login failed. Please try again.')
      }
      setLoading(false)
    }
  }

  const completePayment = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await resendAgentPayment({ phone: normalizePhone(form.phone), pin: form.pin })
      track('agent_resend_payment', {})
      if (!data.paymentUrl) throw new Error('No payment link was returned. Please try again.')
      window.location.href = data.paymentUrl
    } catch (err) {
      setError(err.message || 'Could not start payment. Please try again.')
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
            <BriefcaseIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Agent login</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage your store and earnings.</p>
        </div>
      </div>

      {needsPayment ? (
        // ── Registered but joining fee unpaid → complete payment ──
        <div className="mt-5 rounded-3xl border border-amber-500/40 bg-amber-500/[0.07] p-6 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-500/15 text-amber-500">
            <ClockIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold">Your store isn’t active yet</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            Complete your one-time {formatCedis(AGENT_FEE)} joining fee to activate your store.
          </p>
          <ErrorNote>{error}</ErrorNote>
          <Button onClick={completePayment} loading={loading} size="lg" className="mt-5 w-full">
            Pay {formatCedis(AGENT_FEE)} now
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldIcon className="h-4 w-4 shrink-0 text-brand" /> Secured by Paystack
          </p>
          <button
            onClick={() => { setNeedsPayment(false); setError(''); }}
            className="mt-3 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            ← Back to login
          </button>
        </div>
      ) : (
        <form onSubmit={login} className="mt-5 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
          <div>
            <label className="mb-2 block text-sm font-semibold">Phone number</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              inputMode="numeric"
              autoComplete="tel"
              placeholder="024 123 4567"
              className={inputCls(tried && !phoneOk)}
            />
            {tried && !phoneOk && <p className="mt-1.5 text-xs text-red-500">Enter a valid Ghana number.</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">4-digit PIN</label>
            <input
              value={form.pin}
              onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              inputMode="numeric"
              type="password"
              autoComplete="current-password"
              placeholder="••••"
              maxLength={4}
              className={`${inputCls(tried && !pinOk)} tracking-[0.5em]`}
            />
            {tried && !pinOk && <p className="mt-1.5 text-xs text-red-500">PIN must be 4 digits.</p>}
          </div>

          <ErrorNote>{error}</ErrorNote>

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Log in
          </Button>
          <p className="text-center text-sm text-muted">
            New here?{' '}
            <Link to="/" className="font-semibold text-brand">
              Become an agent
            </Link>
          </p>
        </form>
      )}
    </Page>
  )
}
