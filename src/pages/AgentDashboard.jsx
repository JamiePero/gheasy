import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { clearAgentSession, getAgentSession } from '../lib/store.js'
import { formatCedis } from '../lib/format.js'
import { CheckIcon, CopyIcon, ReceiptIcon, WalletIcon } from '../components/icons.jsx'

const BASE = 'https://api.getflashx.com'

export default function AgentDashboard() {
  const navigate = useNavigate()
  const [session] = useState(() => getAgentSession())
  const [copied, setCopied] = useState(false)
  const agent = session?.agent
  const token = session?.token

  // ── Cashout state ──────────────────────────────────────────────────────────
  const [showCashout, setShowCashout] = useState(false)
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [momoNumber, setMomoNumber] = useState('')
  const [momoNetwork, setMomoNetwork] = useState('mtn')
  const [cashoutLoading, setCashoutLoading] = useState(false)
  const [cashoutError, setCashoutError] = useState('')
  const [cashoutSuccess, setCashoutSuccess] = useState('')

  // ── Pricing state ──────────────────────────────────────────────────────────
  const [showPricing, setShowPricing] = useState(false)
  const [bundles, setBundles] = useState([])
  const [bundlesLoading, setBundlesLoading] = useState(false)
  const [customPrices, setCustomPrices] = useState({})
  const [savingKey, setSavingKey] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)

  // ── Arriving from Paystack callback (not logged in yet) ───────────────────
  if (!agent) {
    return (
      <Page className="wrap-app pb-12 pt-10">
        <div className="rounded-3xl border border-brand/40 bg-brand/[0.07] p-8 text-center shadow-card">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand text-white">
            <CheckIcon className="h-8 w-8" strokeWidth={3} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Payment received 🎉</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Your easy store is being activated. Log in with your phone and PIN to manage it.
          </p>
          <Button to="/agent/login" className="mx-auto mt-6">
            Log in to your store
          </Button>
        </div>
      </Page>
    )
  }

  const storeUrl = agent.storeUrl || `https://gheasy.com/store/${agent.slug}`

  const logout = () => {
    clearAgentSession()
    navigate('/agent/login')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* blocked */ }
  }

  // ── Load bundles for pricing editor ───────────────────────────────────────
  async function loadBundles() {
    setBundlesLoading(true)
    try {
      const res = await fetch(`${BASE}/gheasy/store/${agent.slug}`)
      const data = await res.json()
      if (data.success) {
        setBundles(data.bundles || [])
        // Pre-fill custom prices from agent data
        const prices = {}
        ;(data.bundles || []).forEach((b) => {
          const key = b.network && b.gbAmount
            ? `${b.network}_${b.gbAmount}`
            : b.network
              ? `${b.network}_${b.volumeInMB}`
              : null
          if (key && b.sellPrice !== b.basePrice) prices[key] = String(b.sellPrice)
        })
        setCustomPrices(prices)
      }
    } catch (e) {
      console.error('Failed to load bundles', e)
    } finally {
      setBundlesLoading(false)
    }
  }

  function togglePricing() {
    if (!showPricing && bundles.length === 0) loadBundles()
    setShowPricing((v) => !v)
  }

  async function savePrice(bundleKey, basePrice) {
    const raw = customPrices[bundleKey]
    const price = parseFloat(raw)
    if (!raw || isNaN(price) || price < basePrice) {
      alert(`Price must be at least ${formatCedis(basePrice)} (your cost price).`)
      return
    }
    setSavingKey(bundleKey)
    try {
      const res = await fetch(`${BASE}/gheasy/agent/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-agent-token': token },
        body: JSON.stringify({ bundleKey, price }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setSaveSuccess(bundleKey)
      setTimeout(() => setSaveSuccess(null), 2000)
    } catch (e) {
      alert(e.message || 'Failed to save price.')
    } finally {
      setSavingKey(null)
    }
  }

  // ── Cashout ───────────────────────────────────────────────────────────────
  async function handleCashout() {
    setCashoutError('')
    setCashoutSuccess('')
    const amount = parseFloat(cashoutAmount)
    if (!amount || amount < 10) { setCashoutError('Minimum cashout is GHS 10.'); return }
    if (!momoNumber || momoNumber.length < 10) { setCashoutError('Enter a valid MoMo number.'); return }
    setCashoutLoading(true)
    try {
      const res = await fetch(`${BASE}/gheasy/agent/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-agent-token': token },
        body: JSON.stringify({ amount, momoNumber, momoNetwork }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setCashoutSuccess(`GHS ${data.netAmount?.toFixed(2)} will be sent to ${momoNumber} next business day.`)
      setCashoutAmount('')
      setMomoNumber('')
    } catch (e) {
      setCashoutError(e.message || 'Cashout failed. Try again.')
    } finally {
      setCashoutLoading(false)
    }
  }

  // Group bundles by network for pricing editor
  const networkGroups = bundles.reduce((acc, b) => {
    const net = b.network || 'other'
    if (!acc[net]) acc[net] = []
    acc[net].push(b)
    return acc
  }, {})

  return (
    <Page className="wrap-app pb-12 pt-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Agent · {agent.agentId}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">{agent.storeName}</h1>
        </div>
        <button onClick={logout} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg">
          Log out
        </button>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <WalletIcon className="h-5 w-5 text-brand" />
          <p className="mt-2 text-xs text-muted">Earnings balance</p>
          <p className="font-display text-2xl font-bold tnum text-brand">{formatCedis(agent.earningsBalance || 0)}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <ReceiptIcon className="h-5 w-5 text-brand" />
          <p className="mt-2 text-xs text-muted">Total orders</p>
          <p className="font-display text-2xl font-bold tnum">{agent.totalOrders || 0}</p>
        </div>
      </div>

      {/* Store link */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm font-semibold">Your store link</p>
        <p className="mt-1 break-all text-sm text-muted">{storeUrl}</p>
        <Button onClick={copyLink} variant="secondary" size="sm" icon={<CopyIcon className="h-4 w-4" />} className="mt-3">
          {copied ? 'Copied!' : 'Copy link'}
        </Button>
      </div>

      {/* Cashout */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Request cashout</p>
          <button onClick={() => setShowCashout((v) => !v)} className="text-xs text-brand font-medium">
            {showCashout ? 'Cancel' : 'Withdraw'}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">3% fee · processed next business day</p>

        {showCashout && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Amount (GHS)</label>
              <input
                type="number"
                min="10"
                placeholder="e.g. 50"
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">MoMo number</label>
              <input
                type="tel"
                placeholder="024 123 4567"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">MoMo network</label>
              <select
                value={momoNetwork}
                onChange={(e) => setMomoNetwork(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="mtn">MTN MoMo</option>
                <option value="telecel">Telecel Cash</option>
                <option value="airteltigo">AirtelTigo Money</option>
              </select>
            </div>
            {cashoutError && <p className="text-xs text-red-500">{cashoutError}</p>}
            {cashoutSuccess && <p className="text-xs text-brand">{cashoutSuccess}</p>}
            <Button onClick={handleCashout} loading={cashoutLoading} size="sm" className="w-full">
              Submit cashout request
            </Button>
          </div>
        )}
      </div>

      {/* Pricing editor */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Set your prices</p>
            <p className="mt-0.5 text-xs text-muted">Set prices above the base price to earn more per sale.</p>
          </div>
          <button onClick={togglePricing} className="text-xs text-brand font-medium shrink-0 ml-3">
            {showPricing ? 'Close' : 'Edit'}
          </button>
        </div>

        {showPricing && (
          <div className="mt-4 space-y-6">
            {bundlesLoading && <p className="text-xs text-muted">Loading bundles...</p>}
            {!bundlesLoading && Object.entries(networkGroups).map(([net, netBundles]) => (
              <div key={net}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {net.replace(/_/g, ' ')}
                </p>
                <div className="space-y-2">
                  {netBundles.map((b) => {
                    const key = b.gbAmount
                      ? `${b.network}_${b.gbAmount}`
                      : `${b.network}_${b.volumeInMB}`
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-xs text-muted">{b.name?.match(/\d+GB/i)?.[0] || b.name}</span>
                        <span className="text-xs text-muted">Base: {formatCedis(b.basePrice || b.sellPrice)}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={String(b.sellPrice)}
                          value={customPrices[key] || ''}
                          onChange={(e) => setCustomPrices((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-24 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
                        />
                        <button
                          onClick={() => savePrice(key, b.basePrice || b.sellPrice)}
                          disabled={savingKey === key}
                          className="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {savingKey === key ? '...' : saveSuccess === key ? '✓' : 'Save'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted">Share your link — you earn on every sale.</p>
    </Page>
  )
}