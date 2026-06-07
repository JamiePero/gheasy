import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import PhoneInput from '../components/PhoneInput.jsx'
import NetworkPicker, { NetworkBadge } from '../components/NetworkPicker.jsx'
import BundleCard from '../components/BundleCard.jsx'
import { fetchBundles, initiatePurchase } from '../lib/api.js'
import { track } from '../lib/analytics.js'
import { getProfile, saveOrder, saveProfile } from '../lib/store.js'
import {
  NETWORKS,
  detectNetworkFamily,
  familyLabel,
  formatCedis,
  getNetwork,
  isValidGhPhone,
  networkFamily,
  normalizePhone,
  prettyPhone,
} from '../lib/format.js'
import {
  AlertIcon,
  ArrowLeftIcon,
  DataIcon,
  RefreshIcon,
  ShieldIcon,
} from '../components/icons.jsx'

const validNetwork = (id) => {
  if (NETWORKS.some((n) => n.id === id)) return id
  if (String(id || '').startsWith('airteltigo')) return 'airteltigo_ishare'
  return 'mtn'
}

function BundleSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-[120px] animate-pulse rounded-3xl border border-border bg-surface" />
      ))}
    </div>
  )
}

export default function BuyData() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [network, setNetwork] = useState(() => validNetwork(searchParams.get('network')))
  const [phone, setPhone] = useState(() => getProfile().phone || '')
  const [email, setEmail] = useState(() => getProfile().email || '')
  const [selectedId, setSelectedId] = useState(null)
  const [triedSubmit, setTriedSubmit] = useState(false)

  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [reloadFlag, setReloadFlag] = useState(0)

  const reqId = useRef(0)

  // Load bundles whenever the network changes
  useEffect(() => {
    const id = ++reqId.current
    setLoading(true)
    setLoadError('')
    setSelectedId(null)
    setSubmitError('')
    fetchBundles(network)
      .then((list) => {
        if (id !== reqId.current) return
        setBundles(list)
      })
      .catch((e) => {
        if (id !== reqId.current) return
        setLoadError(e.message || 'Couldn’t load bundles.')
        setBundles([])
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false)
      })
  }, [network, reloadFlag])

  const selectedBundle = useMemo(
    () => bundles.find((b) => b.id === selectedId) || null,
    [bundles, selectedId],
  )

  const phoneValid = isValidGhPhone(phone)
  const detectedFam = detectNetworkFamily(phone)
  const selectedFam = networkFamily(network)
  const mismatch = phoneValid && detectedFam && selectedFam && detectedFam !== selectedFam
  const phoneError = mismatch
    ? `This looks like a ${familyLabel(detectedFam)} number — switch network or check it.`
    : triedSubmit && !phoneValid
      ? 'Enter a valid Ghana number (e.g. 024 123 4567).'
      : ''
  const canPay = phoneValid && !mismatch && !!selectedBundle && !submitting
  const net = getNetwork(network)

  const reload = () => setReloadFlag((f) => f + 1)

  async function handlePay() {
    setSubmitError('')
    setTriedSubmit(true)
    if (!phoneValid || mismatch || !selectedBundle) {
      if (phoneValid && !mismatch && !selectedBundle) setSubmitError('Pick a bundle to continue.')
      return
    }
    setSubmitting(true)
    try {
      const cleanPhone = normalizePhone(phone)
      const payerEmail = email.trim() || `${cleanPhone}@gheasy.com`
      const { url, reference } = await initiatePurchase({
        network,
        phone: cleanPhone,
        email: payerEmail,
        bundle: selectedBundle,
      })
      // Remember the buyer locally (no login) and log the order for History.
      saveProfile({ phone: cleanPhone, ...(email.trim() ? { email: email.trim() } : {}) })
      saveOrder({
        reference: reference || null,
        network,
        volume: selectedBundle.volume || selectedBundle.name,
        amount: selectedBundle.sellPrice,
        phone: cleanPhone,
        status: 'pending',
        source: 'App',
      })
      track('purchase_initiated', {
        network,
        bundle: selectedBundle.volume || selectedBundle.name,
        amount: selectedBundle.sellPrice,
      })
      // Hand off to Paystack — they’ll redirect back to /order-status.
      window.location.href = url
    } catch (e) {
      setSubmitError(e.message || 'Payment couldn’t be started. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Page className="wrap max-w-5xl pb-32 pt-6 md:pb-10 md:pt-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-fg transition-colors hover:border-brand/50 md:hidden"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Buy Data</h1>
          <p className="text-sm text-muted">Pick a network, enter the number, pay. Done.</p>
        </div>
      </div>

      <div className="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ─────────── Form column ─────────── */}
        <div className="space-y-7">
          {/* Network */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-fg">1. Choose network</h2>
            <NetworkPicker value={network} onChange={setNetwork} />
          </section>

          {/* Phone */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-fg">2. Recipient number</h2>
            <PhoneInput value={phone} onChange={setPhone} error={phoneError} />
          </section>

          {/* Bundles */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">3. Choose a bundle</h2>
              {!loading && !loadError && bundles.length > 0 && (
                <span className="text-xs text-muted">{bundles.length} available</span>
              )}
            </div>

            {loading && <BundleSkeleton />}

            {!loading && loadError && (
              <div className="card flex flex-col items-center gap-3 p-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500">
                  <AlertIcon className="h-6 w-6" />
                </span>
                <p className="text-sm text-muted">{loadError}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={reload}
                  icon={<RefreshIcon className="h-4 w-4" />}
                >
                  Try again
                </Button>
              </div>
            )}

            {!loading && !loadError && bundles.length === 0 && (
              <div className="card flex flex-col items-center gap-3 p-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
                  <DataIcon className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium text-fg">No {net.label} bundles right now</p>
                <p className="max-w-xs text-xs text-muted">
                  This network is temporarily out of stock. Try another network or check back soon.
                </p>
              </div>
            )}

            {!loading && !loadError && bundles.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {bundles.map((b) => (
                  <BundleCard
                    key={b.id}
                    bundle={b}
                    active={b.id === selectedId}
                    onSelect={() => {
                      setSelectedId(b.id)
                      setSubmitError('')
                      track('bundle_selected', {
                        network,
                        bundle: b.volume || b.name,
                        price: b.sellPrice,
                      })
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─────────── Summary (md+ inline / lg sidebar) ─────────── */}
        <aside className="hidden md:block lg:sticky lg:top-24">
          <div className="card p-6 shadow-card">
            <h2 className="text-sm font-semibold text-muted">Order summary</h2>

            <div className="mt-5 flex items-center gap-3">
              <NetworkBadge network={net} size="md" />
              <div>
                <p className="font-semibold">{net.label}</p>
                <p className="text-xs text-muted">{phoneValid ? prettyPhone(phone) : 'Enter recipient number'}</p>
              </div>
            </div>

            <dl className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Bundle</dt>
                <dd className="font-semibold">{selectedBundle ? selectedBundle.volume || selectedBundle.name : '—'}</dd>
              </div>
              <div className="flex items-end justify-between">
                <dt className="text-muted">Total</dt>
                <dd className="font-display text-2xl font-bold tnum text-brand">
                  {selectedBundle ? formatCedis(selectedBundle.sellPrice) : '₵0.00'}
                </dd>
              </div>
            </dl>

            {submitError && (
              <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-500">
                <AlertIcon className="mt-px h-4 w-4 shrink-0" />
                {submitError}
              </p>
            )}

            <Button
              onClick={handlePay}
              disabled={!canPay}
              loading={submitting}
              size="lg"
              className="mt-5 w-full"
            >
              {selectedBundle ? `Pay ${formatCedis(selectedBundle.sellPrice)}` : 'Select a bundle'}
            </Button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <ShieldIcon className="h-4 w-4 text-brand" />
              Secured by Paystack
            </p>
          </div>
        </aside>
      </div>

      {/* ─────────── Mobile floating pay bar ─────────── */}
      <AnimatePresence>
        {selectedBundle && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="fixed inset-x-3 bottom-[76px] z-40 md:hidden"
          >
            <div className="flex items-center gap-3 rounded-3xl border border-border glass p-2.5 pl-4 shadow-2xl">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted">
                  {selectedBundle.volume} · {net.label}
                  {phoneValid ? ` · ${prettyPhone(phone)}` : ''}
                </p>
                <p className="font-display text-xl font-bold tnum leading-tight text-fg">
                  {formatCedis(selectedBundle.sellPrice)}
                </p>
              </div>
              <Button onClick={handlePay} disabled={!canPay} loading={submitting} size="md" className="shrink-0">
                Pay now
              </Button>
            </div>
            {submitError && (
              <p className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 py-2 text-center text-xs font-medium text-red-500">
                <AlertIcon className="h-4 w-4" />
                {submitError}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  )
}
