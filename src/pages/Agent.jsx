import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { registerAgent, sendAgentOtp } from '../lib/api.js'
import { AGENT_FEE, formatCedis, isValidGhPhone, normalizePhone } from '../lib/format.js'
import { track } from '../lib/analytics.js'
import {
  AlertIcon,
  ArrowLeftIcon,
  BoltIcon,
  BriefcaseIcon,
  ChartIcon,
  ShieldIcon,
  WalletIcon,
} from '../components/icons.jsx'

const benefits = [
  { Icon: WalletIcon, title: 'Custom pricing', text: 'Set your own price per GB and keep the margin on every sale.' },
  { Icon: BoltIcon, title: 'Instant delivery', text: 'Bundles drop in seconds, so your customers never wait.' },
  { Icon: ChartIcon, title: 'Earn commission', text: 'The more you sell, the more you make. No limits.' },
  { Icon: ShieldIcon, title: 'Secured by Paystack', text: 'A one-time GHS 60 joining fee — no monthly charges, ever.' },
]

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

export default function Agent() {
  const navigate = useNavigate()
  const location = useLocation()
  // navigate(-1) is a no-op when this is the first history entry (PWA start,
  // direct link, or a cross-domain redirect landing) — which left users stuck
  // here with a dead Back button. Fall back to the login page.
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/login'))
  const [step, setStep] = useState('details') // 'details' | 'otp'
  const [existing, setExisting] = useState(false) // phone already registered
  const [form, setForm] = useState({ storeName: '', phone: '', pin: '', supportWhatsapp: '' })
  const [otp, setOtp] = useState('')
  const [tried, setTried] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const phoneOk = isValidGhPhone(form.phone)
  const pinOk = /^\d{4}$/.test(form.pin)
  const supportOk = isValidGhPhone(form.supportWhatsapp)
  const detailsValid = form.storeName.trim() && phoneOk && pinOk && supportOk
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const sendOtp = async (e) => {
    e.preventDefault()
    setTried(true)
    setError('')
    if (!detailsValid) return
    setLoading(true)
    try {
      await sendAgentOtp(normalizePhone(form.phone))
      track('agent_otp_sent', {})
      setStep('otp')
    } catch (err) {
      setError(err.message || 'Could not send the code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const register = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^\d{4,6}$/.test(otp.trim())) {
      setError('Enter the verification code sent to your phone.')
      return
    }
    setLoading(true)
    try {
      const data = await registerAgent({
        phone: normalizePhone(form.phone),
        pin: form.pin,
        storeName: form.storeName.trim(),
        otp: otp.trim(),
        supportWhatsapp: normalizePhone(form.supportWhatsapp),
      })
      track('agent_registered', {})
      if (!data.paymentUrl) throw new Error('No payment link was returned. Please try again.')
      window.location.href = data.paymentUrl
    } catch (err) {
      if (err.status === 409) {
        // Phone already has an account — send them to login instead.
        setExisting(true)
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <Page className="wrap-app pb-12 pt-6">
      <button
        onClick={goBack}
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
            Open your own data store, set your prices, and earn on every sale.
          </p>
        </div>
      </div>

      {existing ? (
        // ── Already registered → go to login ──
        <div className="mt-5 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
            <BriefcaseIcon className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold">You already have an easy account</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            An account with <span className="font-semibold text-fg">{form.phone}</span> already exists.
            Please log in instead.
          </p>
          <Button to="/login" size="lg" className="mt-5 w-full">
            Log in
          </Button>
          <button
            onClick={() => { setExisting(false); setStep('details'); setOtp(''); setError(''); }}
            className="mt-3 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            Use a different number
          </button>
        </div>
      ) : (
        <>
          <p className="mt-3 text-center text-sm text-muted">
            Already an agent?{' '}
            <Link to="/login" className="font-semibold text-brand">
              Log in
            </Link>
          </p>

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

          {step === 'details' ? (
            <form onSubmit={sendOtp} className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
              <div>
                <h2 className="text-lg font-bold">Create your account</h2>
                <p className="mt-0.5 text-sm text-muted">We’ll text a code to verify your number.</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Store name</label>
                <input
                  value={form.storeName}
                  onChange={set('storeName')}
                  placeholder="e.g. Jamie's Data Hub"
                  maxLength={50}
                  className={inputCls(tried && !form.storeName.trim())}
                />
                {tried && !form.storeName.trim() && <p className="mt-1.5 text-xs text-red-500">Required</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Phone number</label>
                <input
                  value={form.phone}
                  onChange={set('phone')}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="024 123 4567"
                  className={inputCls(tried && !phoneOk)}
                />
                {tried && !phoneOk && <p className="mt-1.5 text-xs text-red-500">Enter a valid Ghana number.</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">WhatsApp number for support</label>
                <input
                  value={form.supportWhatsapp}
                  onChange={set('supportWhatsapp')}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="024 123 4567"
                  className={inputCls(tried && !supportOk)}
                />
                {tried && !supportOk ? (
                  <p className="mt-1.5 text-xs text-red-500">Enter a valid Ghana number.</p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted">Customers will message this number for help.</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Choose a 4-digit PIN</label>
                <input
                  value={form.pin}
                  onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  inputMode="numeric"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••"
                  maxLength={4}
                  className={`${inputCls(tried && !pinOk)} tracking-[0.5em]`}
                />
                {tried && !pinOk ? (
                  <p className="mt-1.5 text-xs text-red-500">PIN must be exactly 4 digits.</p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted">You’ll use this to log in to your store.</p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-dashed border-brand/50 bg-brand/[0.05] p-4">
                <div>
                  <p className="text-sm font-semibold">One-time joining fee</p>
                  <p className="text-xs text-muted">Paid via Paystack after you verify.</p>
                </div>
                <p className="font-display text-2xl font-bold tnum text-brand">{formatCedis(AGENT_FEE)}</p>
              </div>

              <ErrorNote>{error}</ErrorNote>

              <Button type="submit" size="lg" loading={loading} className="w-full">
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={register} className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
              <div>
                <h2 className="text-lg font-bold">Verify your number</h2>
                <p className="mt-0.5 text-sm text-muted">
                  Enter the code we sent to <span className="font-semibold text-fg">{form.phone}</span>.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Verification code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="● ● ● ●"
                  className={`${inputCls(false)} text-center text-lg tracking-[0.4em]`}
                />
              </div>

              <ErrorNote>{error}</ErrorNote>

              <Button type="submit" size="lg" loading={loading} className="w-full">
                Pay {formatCedis(AGENT_FEE)} &amp; activate
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                <ShieldIcon className="h-4 w-4 shrink-0 text-brand" /> You’ll be redirected to Paystack to pay securely.
              </p>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => { setStep('details'); setError(''); }}
                  className="font-medium text-muted transition-colors hover:text-fg"
                >
                  ← Change details
                </button>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading}
                  className="font-medium text-brand transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </Page>
  )
}
