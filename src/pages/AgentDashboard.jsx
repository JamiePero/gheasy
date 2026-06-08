import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { clearAgentSession, getAgentSession } from '../lib/store.js'
import { formatCedis } from '../lib/format.js'
import { CheckIcon, CopyIcon, ReceiptIcon, WalletIcon } from '../components/icons.jsx'

export default function AgentDashboard() {
  const navigate = useNavigate()
  const [session] = useState(() => getAgentSession())
  const [copied, setCopied] = useState(false)
  const agent = session?.agent

  // Arriving from the Paystack joining-fee callback (paid, not logged in yet)
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
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <Page className="wrap-app pb-12 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Agent · {agent.agentId}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">{agent.storeName}</h1>
        </div>
        <button onClick={logout} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg">
          Log out
        </button>
      </div>

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

      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm font-semibold">Your store link</p>
        <p className="mt-1 break-all text-sm text-muted">{storeUrl}</p>
        <Button onClick={copyLink} variant="secondary" size="sm" icon={<CopyIcon className="h-4 w-4" />} className="mt-3">
          {copied ? 'Copied!' : 'Copy link'}
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted">Share your link — you earn on every sale.</p>
    </Page>
  )
}
