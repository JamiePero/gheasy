import { useEffect, useState } from 'react'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { formatCedis } from '../lib/format.js'

const BASE = 'https://api.getflashx.com'
const TOKEN_KEY = 'easy-admin-token'

const inp =
  'w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand'

function fmtDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Admin OTP login (reuses /admin/send-otp + /admin/verify-otp) ──
function AdminLogin({ onAuthed }) {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/admin/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Could not send code.')
      setStep('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/admin/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Verification failed.')
      const token = data.token || data.sessionToken
      try {
        localStorage.setItem(TOKEN_KEY, token)
      } catch {
        /* storage blocked */
      }
      onAuthed(token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-border bg-card p-6 shadow-card">
      <h1 className="text-xl font-bold">Admin login</h1>
      <p className="mt-1 text-sm text-muted">A one-time login code will be sent to the admin phone.</p>
      {step === 'email' ? (
        <form onSubmit={sendOtp} className="mt-5 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="Admin email"
            className={inp}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Send code
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-5 space-y-3">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            className={`${inp} text-center tracking-[0.4em]`}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Verify &amp; enter
          </Button>
          <button type="button" onClick={() => setStep('email')} className="w-full text-center text-xs text-muted">
            ← Change email
          </button>
        </form>
      )}
    </div>
  )
}

// ── Payout requests (referral cash redemptions) ──
function PayoutRequests({ token, onUnauth }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [refs, setRefs] = useState({})
  const [busy, setBusy] = useState('')

  const load = async () => {
    setError('')
    try {
      const res = await fetch(`${BASE}/gheasy/admin/payout-requests`, { headers: { 'x-admin-token': token } })
      if (res.status === 401) return onUnauth()
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to load.')
      setRows(data.requests || [])
    } catch (err) {
      setError(err.message)
      setRows([])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const approve = async (id) => {
    setBusy(id)
    try {
      const res = await fetch(`${BASE}/gheasy/admin/payout-requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ momoRef: refs[id] || '' }),
      })
      if (res.status === 401) return onUnauth()
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Payout requests</h2>
        <button onClick={load} className="text-xs font-semibold text-brand">
          Refresh
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {rows === null ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No payout requests yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-surface p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.phone}</p>
                  <p className="text-xs text-muted">
                    {r.points} pts · {fmtDate(r.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tnum text-brand">{formatCedis(r.cashValue)}</p>
                  <span
                    className={`text-[11px] font-semibold ${r.status === 'approved' ? 'text-brand' : 'text-amber-500'}`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
              {r.status !== 'approved' ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={refs[r.id] || ''}
                    onChange={(e) => setRefs((n) => ({ ...n, [r.id]: e.target.value }))}
                    placeholder="MoMo reference / notes"
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-1.5 text-xs outline-none focus:border-brand"
                  />
                  <button
                    onClick={() => approve(r.id)}
                    disabled={busy === r.id}
                    className="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {busy === r.id ? '…' : 'Approve'}
                  </button>
                </div>
              ) : (
                (r.momoRef || r.notes) && (
                  <p className="mt-1 text-[11px] text-muted">
                    MoMo: {r.momoRef || r.notes} · by {r.approvedBy || 'admin'}
                  </p>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Manual data credit ──
function ManualCredit({ token, onUnauth }) {
  const [form, setForm] = useState({ phone: '', network: 'mtn', dataAmount: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/gheasy/admin/manual-credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify(form),
      })
      if (res.status === 401) return onUnauth()
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setMsg(data.message || 'Recorded.')
      setForm({ phone: '', network: 'mtn', dataAmount: '' })
    } catch (err) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
      <h2 className="text-lg font-bold">Manual data credit</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          inputMode="numeric"
          placeholder="Phone number"
          className={inp}
        />
        <select
          value={form.network}
          onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
          className={inp}
        >
          <option value="mtn">MTN</option>
          <option value="telecel">Telecel</option>
          <option value="airteltigo">AirtelTigo</option>
        </select>
        <input
          value={form.dataAmount}
          onChange={(e) => setForm((f) => ({ ...f, dataAmount: e.target.value }))}
          type="number"
          step="0.5"
          min="0"
          placeholder="Data amount (GB)"
          className={inp}
        />
        {msg && <p className="text-xs text-brand">{msg}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Submit credit
        </Button>
      </form>
    </section>
  )
}

export default function Admin() {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  })

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
    setToken(null)
  }

  return (
    <Page className="wrap max-w-2xl pb-16 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">easy admin</h1>
        {token && (
          <button
            onClick={logout}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-fg"
          >
            Log out
          </button>
        )}
      </div>

      {!token ? (
        <div className="mt-8">
          <AdminLogin onAuthed={setToken} />
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          <PayoutRequests token={token} onUnauth={logout} />
          <ManualCredit token={token} onUnauth={logout} />
        </div>
      )}
    </Page>
  )
}
