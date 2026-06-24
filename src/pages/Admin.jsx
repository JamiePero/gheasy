import { useEffect, useMemo, useState } from 'react'
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
const cedis = (n) => formatCedis(Number(n) || 0)
const titalize = (s) => String(s || '').replace(/_/g, ' ')
const netBucket = (n) => {
  const s = String(n || '').toLowerCase()
  if (s.includes('telecel')) return 'telecel'
  if (s.includes('airtel') || s.includes('tigo')) return 'airteltigo'
  return 'mtn'
}

// Shared admin fetch — attaches the OTP token, logs out on 401.
async function adminFetch(path, { token, method = 'GET', body, onUnauth } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'x-admin-token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    onUnauth?.()
    throw new Error('Session expired — please log in again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!data.success) throw new Error(data.error || 'Request failed.')
  return data
}

// Loads data once on mount; exposes { data, error, loading, reload }.
function useAdminData(path, token, onUnauth) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      setData(await adminFetch(path, { token, onUnauth }))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])
  return { data, error, loading, reload }
}

// ── Reusable bits ──
function Card({ children, className = '' }) {
  return <div className={`rounded-3xl border border-border bg-card p-5 shadow-card ${className}`}>{children}</div>
}
function Stat({ label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'border-border bg-card',
    brand: 'border-brand/30 bg-brand/[0.06]',
    warn: 'border-amber-500/40 bg-amber-500/[0.08]',
  }
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tnum">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </div>
  )
}
function Badge({ status }) {
  const s = String(status || '').toLowerCase()
  const tone =
    s === 'active' || s === 'paid' || s === 'approved' || s === 'success' || s === 'credited'
      ? 'bg-brand/15 text-brand'
      : s === 'blocked' || s === 'failed'
        ? 'bg-red-500/15 text-red-400'
        : 'bg-amber-500/15 text-amber-500'
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>{titalize(status)}</span>
}
function Notice({ error }) {
  if (!error) return null
  return <p className="mt-2 text-xs text-red-500">{error}</p>
}

// ── 1. OVERVIEW ──
function Overview({ token, onUnauth, goTo }) {
  const { data, error, loading, reload } = useAdminData('/gheasy/admin/overview', token, onUnauth)
  const [visitors, setVisitors] = useState(null)
  useEffect(() => {
    adminFetch('/admin/visitors', { token })
      .then((d) => setVisitors(d.visitors || d.stats || d))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) return <p className="text-sm text-muted">Loading overview…</p>
  if (error) return <Card><Notice error={error} /></Card>
  const o = data?.overview
  if (!o) return null
  const net = o.orders.byNetwork
  const visitorCount = visitors && (visitors.total ?? visitors.count ?? visitors.unique ?? visitors.allTime)
  const visitorToday = visitors && (visitors.today ?? visitors.day)

  return (
    <div className="space-y-5">
      {/* Action items — highlighted */}
      {(o.pendingReferralCash.count > 0 || o.pendingAgentCashouts.count > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => goTo('referral-cash')} className="text-left">
            <Stat
              tone="warn"
              label="Pending referral cash"
              value={`${o.pendingReferralCash.count}`}
              sub={`${cedis(o.pendingReferralCash.ghs)} owed · tap to review`}
            />
          </button>
          <button onClick={() => goTo('cashouts')} className="text-left">
            <Stat
              tone="warn"
              label="Pending agent cashouts"
              value={`${o.pendingAgentCashouts.count}`}
              sub={`${cedis(o.pendingAgentCashouts.ghs)} owed · tap to review`}
            />
          </button>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Revenue</h2>
          <button onClick={reload} className="text-xs font-semibold text-brand">Refresh</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat tone="brand" label="Your net revenue" value={cedis(o.revenue.net)} sub="after agent profit + referral cash" />
          <Stat label="Total order value" value={cedis(o.revenue.totalOrderValue)} />
          <Stat label="Agent profit paid" value={cedis(o.revenue.agentProfit)} />
          <Stat label="Joining fees" value={cedis(o.revenue.joiningFeeRevenue)} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Orders</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total orders" value={o.orders.total} sub={cedis(o.orders.ghs)} />
          <Stat label="MTN" value={net.mtn.count} sub={cedis(net.mtn.ghs)} />
          <Stat label="Telecel" value={net.telecel.count} sub={cedis(net.telecel.ghs)} />
          <Stat label="AirtelTigo" value={net.airteltigo.count} sub={cedis(net.airteltigo.ghs)} />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Agents &amp; customers</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Active agents" value={o.agents.active} />
            <Stat label="Pending agents" value={o.agents.pending} />
            <Stat label="Blocked agents" value={o.agents.blocked} />
            <Stat label="Customers reached" value={o.customersReached} />
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Referral points</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Points issued" value={o.referralPoints.issued} sub={`${o.referralPoints.creditedReferrals} credited`} />
            <Stat label="Points redeemed" value={o.referralPoints.redeemed} />
            {visitorCount != null && <Stat label="Visitors" value={visitorCount} sub={visitorToday != null ? `${visitorToday} today` : undefined} />}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── 2. REFERRAL CASH REQUESTS ──
function ReferralCash({ token, onUnauth }) {
  const { data, error, loading, reload } = useAdminData('/gheasy/admin/payout-requests', token, onUnauth)
  const [refs, setRefs] = useState({})
  const [busy, setBusy] = useState('')
  const rows = data?.requests || []

  const approve = async (id) => {
    setBusy(id)
    try {
      await adminFetch(`/gheasy/admin/payout-requests/${id}/approve`, {
        token, method: 'POST', onUnauth, body: { momoRef: refs[id] || '' },
      })
      await reload()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Referral cash requests</h2>
        <button onClick={reload} className="text-xs font-semibold text-brand">Refresh</button>
      </div>
      <Notice error={error} />
      {loading ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No requests yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={`rounded-2xl border p-3 text-sm ${r.flagged ? 'border-red-500/50 bg-red-500/[0.06]' : 'border-border bg-surface'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {r.phone} {r.flagged && <span className="ml-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">FLAGGED</span>}
                  </p>
                  <p className="text-xs text-muted">{r.points} pts · {fmtDate(r.timestamp)}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {r.priorPayouts} prior payout{r.priorPayouts === 1 ? '' : 's'} · {cedis(r.totalPaidToPhone)} paid to this phone before
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tnum text-brand">{cedis(r.cashValue)}</p>
                  <Badge status={r.status} />
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
                  <p className="mt-1 text-[11px] text-muted">MoMo: {r.momoRef || r.notes} · by {r.approvedBy || 'admin'}</p>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── 3. AGENT CASHOUTS ──
function Cashouts({ token, onUnauth }) {
  const { data, error, loading, reload } = useAdminData('/gheasy/admin/payouts', token, onUnauth)
  const [busy, setBusy] = useState('')
  const rows = data?.payouts || []

  const markPaid = async (id) => {
    setBusy(id)
    try {
      await adminFetch(`/gheasy/admin/payouts/${id}/process`, { token, method: 'POST', onUnauth })
      await reload()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Agent cashouts</h2>
        <button onClick={reload} className="text-xs font-semibold text-brand">Refresh</button>
      </div>
      <Notice error={error} />
      {loading ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No cashouts yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-surface p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{p.storeName || p.agentId || '—'}</p>
                  <p className="text-xs text-muted">{p.agentId} · {p.phoneNumber}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    MoMo: {p.momoNumber || '—'} {p.momoNetwork ? `(${titalize(p.momoNetwork)})` : ''} · {fmtDate(p.requestedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tnum text-brand">{cedis(p.netAmount ?? p.amount)}</p>
                  <p className="text-[11px] text-muted">of {cedis(p.amount)}</p>
                  <Badge status={p.status} />
                </div>
              </div>
              {p.status === 'pending' && (
                <button
                  onClick={() => markPaid(p.id)}
                  disabled={busy === p.id}
                  className="mt-2 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {busy === p.id ? '…' : 'Mark as paid'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── 4. AGENTS ──
function Agents({ token, onUnauth }) {
  const { data, error, loading, reload } = useAdminData('/gheasy/admin/agents', token, onUnauth)
  const [busy, setBusy] = useState('')
  const [detail, setDetail] = useState(null)
  const rows = data?.agents || []

  const toggleBlock = async (id) => {
    setBusy(id)
    try {
      await adminFetch(`/gheasy/admin/agents/${id}/block`, { token, method: 'POST', onUnauth })
      await reload()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy('')
    }
  }
  const view = async (id) => {
    setDetail({ loading: true })
    try {
      const d = await adminFetch(`/gheasy/admin/agents/${id}`, { token, onUnauth })
      setDetail({ agent: d.agent, orders: d.orders || [] })
    } catch (e) {
      setDetail({ error: e.message })
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Agents</h2>
        <button onClick={reload} className="text-xs font-semibold text-brand">Refresh</button>
      </div>
      <Notice error={error} />
      {loading ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((a) => (
            <div key={a.id} className="rounded-2xl border border-border bg-surface p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{a.storeName}</p>
                  <p className="text-xs text-muted">{a.agentId} · {a.phoneNumber}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {cedis(a.earningsBalance)} balance · {cedis(a.totalEarned)} earned · {a.totalOrders} orders · joined {fmtDate(a.joinedAt || a.createdAt)}
                  </p>
                </div>
                <Badge status={a.status} />
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => view(a.id)} className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold">View</button>
                <button
                  onClick={() => toggleBlock(a.id)}
                  disabled={busy === a.id}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${a.status === 'blocked' ? 'bg-brand text-white' : 'border border-red-500/40 text-red-400'}`}
                >
                  {busy === a.id ? '…' : a.status === 'blocked' ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setDetail(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            {detail.loading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : detail.error ? (
              <Notice error={detail.error} />
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{detail.agent.storeName}</h3>
                    <p className="text-xs text-muted">{detail.agent.agentId} · {detail.agent.phoneNumber}</p>
                  </div>
                  <button onClick={() => setDetail(null)} className="text-lg leading-none text-muted">×</button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Stat label="Balance" value={cedis(detail.agent.earningsBalance)} />
                  <Stat label="Total earned" value={cedis(detail.agent.totalEarned)} />
                  <Stat label="Paid out" value={cedis(detail.agent.totalPaidOut)} />
                  <Stat label="Orders" value={detail.agent.totalOrders} />
                </div>
                {detail.agent.supportWhatsapp && (
                  <p className="mt-2 text-xs text-muted">Support WhatsApp: {detail.agent.supportWhatsapp}</p>
                )}
                <h4 className="mt-4 text-sm font-bold">Custom prices</h4>
                {Object.keys(detail.agent.customPrices || {}).length === 0 ? (
                  <p className="mt-1 text-xs text-muted">Using default prices.</p>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {Object.entries(detail.agent.customPrices).map(([k, v]) => (
                      <span key={k} className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px]">{k}: {cedis(v)}</span>
                    ))}
                  </div>
                )}
                <h4 className="mt-4 text-sm font-bold">Recent orders</h4>
                {detail.orders.length === 0 ? (
                  <p className="mt-1 text-xs text-muted">No orders yet.</p>
                ) : (
                  <div className="mt-1 space-y-1.5">
                    {detail.orders.map((od) => (
                      <div key={od.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-1.5 text-xs">
                        <span>{od.recipientPhone} · {od.bundle} {String(od.network || '').toUpperCase()}</span>
                        <span className="tnum text-brand">{cedis(od.sellPrice)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

// ── 5. ORDERS / TRANSACTIONS ──
function Orders({ token, onUnauth }) {
  const { data, error, loading, reload } = useAdminData('/gheasy/admin/orders', token, onUnauth)
  const [f, setF] = useState({ network: 'all', status: 'all', source: 'all', q: '' })
  const rows = data?.orders || []

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    return rows.filter((o) => {
      if (f.network !== 'all' && netBucket(o.network) !== f.network) return false
      if (f.status !== 'all' && String(o.status || '').toLowerCase() !== f.status) return false
      if (f.source !== 'all' && o.source !== f.source) return false
      if (q && ![o.recipientPhone, o.orderRef, o.storeName, o.bundle].some((v) => String(v || '').toLowerCase().includes(q))) return false
      return true
    })
  }, [rows, f])

  const sel = 'rounded-xl border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand'
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Orders <span className="text-sm font-normal text-muted">({filtered.length})</span></h2>
        <button onClick={reload} className="text-xs font-semibold text-brand">Refresh</button>
      </div>
      <Notice error={error} />
      <div className="mt-3 flex flex-wrap gap-2">
        <input value={f.q} onChange={(e) => setF((s) => ({ ...s, q: e.target.value }))} placeholder="Search phone / ref / store" className={`${sel} min-w-[160px] flex-1`} />
        <select value={f.network} onChange={(e) => setF((s) => ({ ...s, network: e.target.value }))} className={sel}>
          <option value="all">All networks</option><option value="mtn">MTN</option><option value="telecel">Telecel</option><option value="airteltigo">AirtelTigo</option>
        </select>
        <select value={f.status} onChange={(e) => setF((s) => ({ ...s, status: e.target.value }))} className={sel}>
          <option value="all">All status</option><option value="processing">Processing</option><option value="success">Success</option><option value="failed">Failed</option>
        </select>
        <select value={f.source} onChange={(e) => setF((s) => ({ ...s, source: e.target.value }))} className={sel}>
          <option value="all">All sources</option><option value="direct">Direct</option><option value="agent">Agent</option>
        </select>
      </div>
      {loading ? (
        <p className="mt-3 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-3 space-y-2">
          {filtered.map((o) => (
            <div key={o.id} className="flex items-start justify-between gap-2 rounded-2xl border border-border bg-surface p-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold">{o.recipientPhone || '—'} · {o.bundle} {String(o.network || '').toUpperCase()}</p>
                <p className="truncate text-[11px] text-muted">
                  {o.orderRef} · {fmtDate(o.date)} · {o.source === 'agent' ? `agent: ${o.storeName || o.agentId}` : 'direct'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold tnum text-brand">{cedis(o.amount)}</p>
                <Badge status={o.status} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted">No matching orders.</p>}
        </div>
      )}
    </Card>
  )
}

// ── 6. REFERRALS ──
function Referrals({ token, onUnauth }) {
  const { data, error, loading, reload } = useAdminData('/gheasy/admin/referrals', token, onUnauth)
  const top = data?.topReferrers || []
  const list = data?.referrals || []
  const sum = data?.summary

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Referrals</h2>
          <button onClick={reload} className="text-xs font-semibold text-brand">Refresh</button>
        </div>
        <Notice error={error} />
        {sum && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Total referrals" value={sum.total} />
            <Stat label="Credited" value={sum.credited} />
            <Stat label="Points issued" value={sum.pointsIssued} />
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Top referrers</h2>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Loading…</p>
        ) : top.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No referrers yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {top.map((t, i) => (
              <div key={t.referrerId + i} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 text-sm">
                <div>
                  <p className="font-semibold">{t.phone || t.code || t.referrerId}</p>
                  <p className="text-[11px] text-muted">{t.code || '—'}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">{t.total} referred</p>
                  <p className="text-muted">{t.credited} credited · {t.points} pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Recent referrals</h2>
        {!loading && list.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No referrals yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {list.slice(0, 60).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 text-sm">
                <div>
                  <p className="font-semibold">{r.referrerPhone || r.referrerCode || '—'} → {r.referredPhone || '***'}</p>
                  <p className="text-[11px] text-muted">{fmtDate(r.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{r.points} pts</p>
                  <Badge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Tools: manual data credit (kept from the old admin) ──
function Tools({ token, onUnauth }) {
  const [form, setForm] = useState({ phone: '', network: 'mtn', dataAmount: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const d = await adminFetch('/gheasy/admin/manual-credit', { token, method: 'POST', onUnauth, body: form })
      setMsg(d.message || 'Recorded.')
      setForm({ phone: '', network: 'mtn', dataAmount: '' })
    } catch (e2) {
      setMsg(e2.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Card className="max-w-md">
      <h2 className="text-lg font-bold">Manual data credit</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} inputMode="numeric" placeholder="Phone number" className={inp} />
        <select value={form.network} onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))} className={inp}>
          <option value="mtn">MTN</option><option value="telecel">Telecel</option><option value="airteltigo">AirtelTigo</option>
        </select>
        <input value={form.dataAmount} onChange={(e) => setForm((f) => ({ ...f, dataAmount: e.target.value }))} type="number" step="0.5" min="0" placeholder="Data amount (GB)" className={inp} />
        {msg && <p className="text-xs text-brand">{msg}</p>}
        <Button type="submit" loading={loading} className="w-full">Submit credit</Button>
      </form>
    </Card>
  )
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Verification failed.')
      const token = data.token || data.sessionToken
      try { localStorage.setItem(TOKEN_KEY, token) } catch { /* storage blocked */ }
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
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="Admin email" className={inp} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">Send code</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-5 space-y-3">
          <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" className={`${inp} text-center tracking-[0.4em]`} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">Verify &amp; enter</Button>
          <button type="button" onClick={() => setStep('email')} className="w-full text-center text-xs text-muted">← Change email</button>
        </form>
      )}
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'referral-cash', label: 'Referral cash' },
  { id: 'cashouts', label: 'Cashouts' },
  { id: 'agents', label: 'Agents' },
  { id: 'orders', label: 'Orders' },
  { id: 'referrals', label: 'Referrals' },
  { id: 'tools', label: 'Tools' },
]

export default function Admin() {
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  })
  const [tab, setTab] = useState('overview')

  const logout = () => {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
    setToken(null)
  }

  const sectionProps = { token, onUnauth: logout, goTo: setTab }

  return (
    <Page className="wrap max-w-6xl pb-16 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">easy admin</h1>
        {token && (
          <button onClick={logout} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-fg">Log out</button>
        )}
      </div>

      {!token ? (
        <div className="mt-8"><AdminLogin onAuthed={setToken} /></div>
      ) : (
        <div className="mt-6">
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${tab === t.id ? 'bg-brand text-white' : 'border border-border bg-card text-muted hover:text-fg'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === 'overview' && <Overview {...sectionProps} />}
            {tab === 'referral-cash' && <ReferralCash {...sectionProps} />}
            {tab === 'cashouts' && <Cashouts {...sectionProps} />}
            {tab === 'agents' && <Agents {...sectionProps} />}
            {tab === 'orders' && <Orders {...sectionProps} />}
            {tab === 'referrals' && <Referrals {...sectionProps} />}
            {tab === 'tools' && <Tools {...sectionProps} />}
          </div>
        </div>
      )}
    </Page>
  )
}
