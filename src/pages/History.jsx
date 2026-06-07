import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { getOrders, updateOrder } from '../lib/store.js'
import { getOrder } from '../lib/api.js'
import { formatCedis, getNetwork, prettyPhone } from '../lib/format.js'
import { ArrowRightIcon, ReceiptIcon, RefreshIcon, SearchIcon } from '../components/icons.jsx'

const STATUS_BADGE = {
  success: 'bg-brand/15 text-brand',
  processing: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  failed: 'bg-red-500/15 text-red-500',
}
const STATUS_LABEL = { success: 'Delivered', processing: 'Processing', pending: 'Pending', failed: 'Failed' }

function fmtDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function History() {
  const [orders, setOrders] = useState(() => getOrders())
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    const current = getOrders()
    await Promise.allSettled(
      current
        .filter((o) => o.reference && o.status !== 'success' && o.status !== 'failed')
        .map(async (o) => {
          try {
            const res = await getOrder(o.reference)
            if (res.found && res.order?.status) {
              updateOrder({ reference: o.reference }, { status: res.order.status })
            }
          } catch {
            /* ignore individual failures */
          }
        }),
    )
    setOrders(getOrders())
    setRefreshing(false)
  }, [])

  return (
    <Page className="wrap-app pb-10 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">History</h1>
          <p className="text-sm text-muted">All your transactions</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={refresh}
          loading={refreshing}
          icon={<RefreshIcon className="h-4 w-4" />}
        >
          Refresh
        </Button>
      </div>

      <Link
        to="/order-status"
        className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-brand/40"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
          <SearchIcon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Check an order by reference</p>
          <p className="text-xs text-muted">Track delivery with your Paystack reference</p>
        </div>
        <ArrowRightIcon className="h-4 w-4 text-muted" />
      </Link>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
            <ReceiptIcon className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold">No transactions yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Your data purchases will appear here so you can track them anytime.
          </p>
          <Button to="/buy-data" className="mt-6" iconRight={<ArrowRightIcon className="h-5 w-5" />}>
            Buy Data
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => {
            const net = getNetwork(o.network)
            const badge = STATUS_BADGE[o.status] || STATUS_BADGE.pending
            const inner = (
              <div className="rounded-3xl border border-border bg-card p-4 transition-colors hover:border-brand/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-xs font-bold"
                      style={{ background: net.gradient, color: net.ink }}
                    >
                      {net.abbr}
                    </span>
                    <div>
                      <p className="font-semibold leading-tight">
                        {o.volume} <span className="text-muted">({net.label})</span>
                      </p>
                      <p className="mt-0.5 text-sm font-bold tnum text-brand">{formatCedis(o.amount)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="chip">{o.source || 'App'}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>
                      {STATUS_LABEL[o.status] || 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
                  <span>Purchased: {fmtDate(o.createdAt)}</span>
                  <span>{o.phone ? prettyPhone(o.phone) : 'Expires: —'}</span>
                </div>
              </div>
            )
            return o.reference ? (
              <Link key={o.id} to={`/order-status?reference=${encodeURIComponent(o.reference)}`}>
                {inner}
              </Link>
            ) : (
              <div key={o.id}>{inner}</div>
            )
          })}
        </div>
      )}
    </Page>
  )
}
