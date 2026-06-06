import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Spinner from '../components/Spinner.jsx'
import { NetworkBadge } from '../components/NetworkPicker.jsx'
import { getOrder } from '../lib/api.js'
import { formatCedis, getNetwork, prettyPhone } from '../lib/format.js'
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  ClockIcon,
  RefreshIcon,
  SearchIcon,
  ReceiptIcon,
  XIcon,
} from '../components/icons.jsx'

const META = {
  success: {
    label: 'Delivered',
    desc: 'Your data bundle has been delivered successfully. Enjoy! ⚡',
    Icon: CheckIcon,
    tone: 'text-brand',
    chip: 'bg-brand/10 text-brand',
  },
  processing: {
    label: 'Processing',
    desc: 'Payment received — your bundle is on its way. This usually takes a few seconds.',
    Icon: ClockIcon,
    tone: 'text-amber-500',
    chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  pending: {
    label: 'Pending',
    desc: 'We’re waiting for your payment to be confirmed.',
    Icon: ClockIcon,
    tone: 'text-amber-500',
    chip: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  failed: {
    label: 'Failed',
    desc: 'This order didn’t go through. If you were charged, a refund is on the way.',
    Icon: XIcon,
    tone: 'text-red-500',
    chip: 'bg-red-500/10 text-red-500',
  },
}

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('en-GH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function DetailRow({ label, children }) {
  if (!children) return null
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-fg">{children}</dd>
    </div>
  )
}

export default function OrderStatus() {
  const [searchParams] = useSearchParams()
  const redirectRef =
    searchParams.get('reference') || searchParams.get('trxref') || searchParams.get('ref') || ''

  const [input, setInput] = useState(redirectRef)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [fromPaystack] = useState(Boolean(redirectRef))

  const pollTimer = useRef(null)
  const pollCount = useRef(0)

  const check = useCallback(
    async (refArg) => {
      const ref = String(refArg ?? '').trim()
      if (!ref) {
        setError('Enter an order reference or phone number.')
        return
      }
      setError('')
      setChecking(true)
      try {
        const res = await getOrder(ref)
        setResult(res)
        setHasSearched(true)
      } catch (e) {
        setError(e.message || 'Something went wrong. Please try again.')
        setResult(null)
      } finally {
        setChecking(false)
      }
    },
    [],
  )

  // Auto-check when arriving back from Paystack
  useEffect(() => {
    if (redirectRef) check(redirectRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Quietly poll while the order is still settling
  useEffect(() => {
    clearInterval(pollTimer.current)
    const order = result?.found ? result.order : null
    const settling = order && (order.status === 'pending' || order.status === 'processing')
    if (settling && order.reference) {
      pollCount.current = 0
      pollTimer.current = setInterval(async () => {
        pollCount.current += 1
        try {
          const res = await getOrder(order.reference)
          if (res.found) setResult(res)
          const done =
            !res.found ||
            (res.order.status !== 'pending' && res.order.status !== 'processing') ||
            pollCount.current >= 8
          if (done) clearInterval(pollTimer.current)
        } catch {
          /* keep trying silently */
        }
      }, 7000)
    }
    return () => clearInterval(pollTimer.current)
  }, [result])

  const onSubmit = (e) => {
    e.preventDefault()
    check(input)
  }

  const order = result?.found ? result.order : null
  const meta = order ? META[order.status] || META.pending : null
  const settling = order && (order.status === 'pending' || order.status === 'processing')

  return (
    <Page className="wrap-tight max-w-lg pb-12 pt-8 md:pt-14">
      <div className="text-center">
        <span className="inline-flex chip">
          <ReceiptIcon className="h-3.5 w-3.5 text-brand" /> Order status
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Track your order</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your order reference (or phone number) to check delivery.
        </p>
      </div>

      {/* Paystack return banner */}
      <AnimatePresence>
        {fromPaystack && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/[0.07] p-4"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white">
              <CheckIcon className="h-5 w-5" strokeWidth={3} />
            </span>
            <p className="text-sm font-medium text-fg">
              Payment received — we’re confirming your delivery below.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <form onSubmit={onSubmit} className="mt-6">
        <div
          className={`flex items-center gap-2 rounded-2xl border bg-card px-3 transition-colors ${
            error ? 'border-red-400' : 'border-border focus-within:border-brand'
          }`}
        >
          <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              if (error) setError('')
            }}
            placeholder="e.g. GH-9F3K2A or 024 123 4567"
            className="w-full bg-transparent py-3.5 text-[15px] font-medium text-fg outline-none placeholder:font-normal placeholder:text-muted/60"
          />
        </div>
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-500">
            <AlertIcon className="h-3.5 w-3.5" />
            {error}
          </p>
        )}
        <Button type="submit" loading={checking} className="mt-4 w-full" size="lg">
          Check status
        </Button>
      </form>

      {/* Result */}
      <AnimatePresence mode="wait">
        {order && meta && (
          <motion.div
            key={order.reference + order.status}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="card mt-7 overflow-hidden p-6 shadow-card"
          >
            <div className="flex flex-col items-center text-center">
              <span className={`grid h-16 w-16 place-items-center rounded-full ${meta.chip}`}>
                {settling ? <Spinner className={`h-7 w-7 ${meta.tone}`} /> : <meta.Icon className={`h-8 w-8 ${meta.tone}`} strokeWidth={settling ? 1.75 : 2.4} />}
              </span>
              <span className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.chip}`}>
                {meta.label}
              </span>
              <p className="mt-3 max-w-xs text-sm text-muted">{meta.desc}</p>
            </div>

            <dl className="mt-6 divide-y divide-border border-t border-border">
              {order.network && (
                <DetailRow label="Network">
                  <span className="inline-flex items-center gap-2">
                    <NetworkBadge network={getNetwork(order.network)} size="sm" />
                    {getNetwork(order.network).label}
                  </span>
                </DetailRow>
              )}
              <DetailRow label="Bundle">{order.volume || order.bundle}</DetailRow>
              <DetailRow label="Recipient">{order.phone ? prettyPhone(order.phone) : null}</DetailRow>
              <DetailRow label="Amount">
                {order.amount != null ? formatCedis(order.amount) : null}
              </DetailRow>
              <DetailRow label="Reference">
                <span className="font-mono text-xs">{order.reference}</span>
              </DetailRow>
              <DetailRow label="Date">{formatDate(order.createdAt)}</DetailRow>
            </dl>

            <div className="mt-5 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => check(order.reference)}
                loading={checking}
                icon={<RefreshIcon className="h-4 w-4" />}
                className="flex-1"
              >
                Refresh
              </Button>
              <Button to="/buy-data" size="md" className="flex-1" iconRight={<ArrowRightIcon className="h-4 w-4" />}>
                Buy more
              </Button>
            </div>

            {settling && (
              <p className="mt-3 text-center text-xs text-muted">Auto-refreshing every few seconds…</p>
            )}
          </motion.div>
        )}

        {/* Not found */}
        {hasSearched && result && !result.found && !checking && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card mt-7 flex flex-col items-center p-8 text-center shadow-card"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-muted">
              <SearchIcon className="h-7 w-7" />
            </span>
            <p className="mt-4 font-semibold text-fg">No order found</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              We couldn’t find an order for “{input.trim()}”. Double-check the reference and try again.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  )
}
