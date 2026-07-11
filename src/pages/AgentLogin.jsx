import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { loginAccount, resendAgentPayment } from '../lib/api.js'
import { friendlyError } from '../lib/errors.js'
import { AGENT_FEE, formatCedis, isValidGhPhone, normalizePhone } from '../lib/format.js'
import { saveAgentSession, saveCustomerSession } from '../lib/store.js'
import { isAgentHost, AGENT_ORIGIN, CUSTOMER_ORIGIN } from '../lib/host.js'
import { track } from '../lib/analytics.js'
import { WHATSAPP_NUMBER } from '../config.js'
import { AlertIcon, ArrowLeftIcon, ClockIcon, ShieldIcon } from '../components/icons.jsx'

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

  // No self-service PIN reset yet → route "Forgot PIN" to WhatsApp support.
  const waDigits = String(WHATSAPP_NUMBER).replace(/\D/g, '')
  const forgotPinHref = `https://wa.me/${waDigits}?text=${encodeURIComponent(
    'Hi easy, I forgot my account PIN and need help resetting it.',
  )}`

  const login = async (e) => {
    e.preventDefault()
    setTried(true)
    setError('')
    setNeedsPayment(false)
    if (!valid) return
    setLoading(true)
    try {
      const data = await loginAccount({ phone: normalizePhone(form.phone), pin: form.pin })
      const onAgentHost = isAgentHost()
      if (data.type === 'customer') {
        track('customer_login', {})
        if (onAgentHost) {
          // Customer session belongs on the customer origin → hand off.
          window.location.replace(`${CUSTOMER_ORIGIN}/account#sso=${data.token}&t=customer`)
        } else {
          saveCustomerSession({ token: data.token, customer: data.customer })
          navigate('/account')
        }
      } else {
        track('agent_login', {})
        if (onAgentHost) {
          saveAgentSession({ token: data.token, agent: data.agent })
          navigate('/dashboard')
        } else {
          // Agent session belongs on the agent origin → hand off the token.
          window.location.replace(`${AGENT_ORIGIN}/dashboard#sso=${data.token}&t=agent`)
        }
      }
    } catch (err) {
      if (err.status === 403 && /joining fee/i.test(err.message)) {
        setNeedsPayment(true) // registered but never paid → offer to complete payment
      } else {
        setError(friendlyError(err, 'Login failed. Please try again.'))
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
      setError(friendlyError(err, 'Could not start payment. Please try again.'))
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
            <ShieldIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Log in to your account</h1>
          <p className="mt-1 text-sm text-muted">Enter your phone number and PIN to continue.</p>
          <p className="mt-4 rounded-xl bg-brand/10 p-3 text-xs leading-relaxed text-fg/80">
            You can buy data without an account. Log in to access referrals, order history, and more.
          </p>
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
          {waDigits && (
            <a
              href={forgotPinHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm font-medium text-muted transition-colors hover:text-brand"
            >
              Forgot your PIN?
            </a>
          )}
          <div className="space-y-2 pt-1 text-center text-sm text-muted">
            <p>
              New here?{' '}
              <Link to="/register" className="font-semibold text-brand">Create a free account</Link>
            </p>
            <p>
              Want your own store?{' '}
              <Link to="/agent" className="font-semibold text-brand">Become an agent ({formatCedis(AGENT_FEE)})</Link>
            </p>
          </div>
        </form>
      )}
    </Page>
  )
}
