import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { getReferralCode } from '../lib/store.js'
import { track } from '../lib/analytics.js'
import {
  ArrowLeftIcon,
  ClockIcon,
  CopyIcon,
  GiftIcon,
  ShareIcon,
  UsersIcon,
} from '../components/icons.jsx'

export default function Refer() {
  const navigate = useNavigate()
  const [code] = useState(() => getReferralCode())
  const link = `https://gheasy.com/?ref=${code}`
  const [copied, setCopied] = useState('')

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  const share = async () => {
    track('refer_shared', { code })
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join me on easy', text: `Use my code ${code} on easy`, url: link })
      } catch {
        /* user cancelled */
      }
    } else {
      copy(link, 'link')
    }
  }

  const points = 0
  const friends = 0
  const pending = 0
  const goal = 10

  const stats = [
    { Icon: GiftIcon, label: 'Points', value: points },
    { Icon: UsersIcon, label: 'Friends', value: friends, sub: 'referred' },
    { Icon: ClockIcon, label: 'Pending', value: pending, sub: 'awaiting purchase' },
  ]

  return (
    <Page className="wrap-app pb-12 pt-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Refer a Friend</h1>
      <p className="text-sm text-muted">Earn data when friends join easy</p>

      {/* Referral code card */}
      <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your referral code</p>
        <p className="mt-2 font-display text-3xl font-bold tracking-wide text-brand">{code}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => copy(code, 'code')} icon={<CopyIcon className="h-4 w-4" />}>
            {copied === 'code' ? 'Copied!' : 'Copy code'}
          </Button>
          <Button onClick={share} icon={<ShareIcon className="h-4 w-4" />}>
            Share link
          </Button>
        </div>
        <button
          onClick={() => copy(link, 'link')}
          className="mt-4 break-all text-xs text-muted transition-colors hover:text-brand"
        >
          {link}
          {copied === 'link' ? ' · Copied!' : ''}
        </button>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <s.Icon className="mx-auto h-5 w-5 text-brand" />
            <p className="mt-1 text-xs text-muted">{s.label}</p>
            <p className="font-display text-2xl font-bold">{s.value}</p>
            {s.sub && <p className="text-[10px] leading-tight text-muted">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="mt-6 text-center">
        <p className="text-sm">
          <span className="font-bold">{points}</span>{' '}
          <span className="text-muted">/ {goal} points to redeem</span>
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.min(100, (points / goal) * 100)}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          Earn {goal - points} more points to get <span className="font-semibold text-fg">1GB free data</span>
        </p>
        <p className="mt-2 text-xs text-muted">
          Points are credited when your referred friend makes their first purchase. 10 points = 1GB.
        </p>
      </div>

      {/* Referrals list */}
      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-muted">Your referrals</h2>
      <div className="mt-3 rounded-3xl border border-dashed border-border bg-card/60 p-7 text-center">
        <p className="text-sm text-muted">No referrals yet — share your code!</p>
      </div>
    </Page>
  )
}
