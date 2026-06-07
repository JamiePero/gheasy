import { useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { LogoMark } from '../components/Logo.jsx'
import { getProfile, saveProfile } from '../lib/store.js'
import { isValidGhPhone } from '../lib/format.js'
import {
  BriefcaseIcon,
  CheckIcon,
  ChevronRightIcon,
  GiftIcon,
  InfoIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldIcon,
} from '../components/icons.jsx'

const menu = [
  { to: '/agent', label: 'Become an Agent', desc: 'Resell data and earn', Icon: BriefcaseIcon },
  { to: '/refer', label: 'Refer a Friend', desc: 'Earn free data', Icon: GiftIcon },
  { to: '/history', label: 'Order History', desc: 'All your transactions', Icon: ReceiptIcon },
  { to: '/order-status', label: 'Check Order Status', desc: 'Track by reference', Icon: SearchIcon },
  { to: '/about', label: 'About easy', desc: 'Our mission', Icon: InfoIcon },
]

const inp = (err) =>
  `w-full rounded-2xl border bg-card px-3.5 py-3 text-[15px] font-medium text-fg outline-none transition-colors placeholder:font-normal placeholder:text-muted/50 ${
    err ? 'border-red-400' : 'border-border focus:border-brand'
  }`

export default function More() {
  const [profile, setProfile] = useState(() => getProfile())
  const [saved, setSaved] = useState(false)
  const phoneOk = !profile.phone || isValidGhPhone(profile.phone)
  const set = (k) => (e) => setProfile((p) => ({ ...p, [k]: e.target.value }))

  const save = () => {
    if (!phoneOk) return
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <Page className="wrap-app pb-12 pt-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">More</h1>
      <p className="text-sm text-muted">Your account &amp; shortcuts</p>

      {/* Identity */}
      <div className="mt-5 flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <LogoMark className="h-14 w-14" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{profile.name?.trim() || 'Guest'}</p>
          <p className="truncate text-sm text-muted">{profile.phone?.trim() || 'No phone saved'}</p>
        </div>
      </div>

      {/* Optional details */}
      <section className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-bold">
          Your details <span className="font-normal text-muted">(optional)</span>
        </h2>
        <p className="mt-0.5 text-xs text-muted">Saved on this device to speed up checkout. No login needed.</p>
        <div className="mt-4 space-y-3">
          <input value={profile.name} onChange={set('name')} placeholder="Full name" className={inp(false)} />
          <input
            value={profile.phone}
            onChange={set('phone')}
            inputMode="numeric"
            placeholder="Phone number (024…)"
            className={inp(!phoneOk)}
          />
          <input value={profile.email} onChange={set('email')} type="email" placeholder="Email (for receipts)" className={inp(false)} />
        </div>
        <Button
          onClick={save}
          disabled={!phoneOk}
          className="mt-4 w-full"
          icon={saved ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : undefined}
        >
          {saved ? 'Saved' : 'Save details'}
        </Button>
      </section>

      {/* Menu */}
      <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        {menu.map((m, i) => (
          <Link
            key={m.to + m.label}
            to={m.to}
            className={`flex items-center gap-3 p-4 transition-colors hover:bg-surface ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
              <m.Icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">{m.label}</p>
              <p className="text-xs text-muted">{m.desc}</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-muted" />
          </Link>
        ))}
      </section>

      {/* Appearance */}
      <section className="mt-5 flex items-center justify-between rounded-3xl border border-border bg-card p-4 shadow-card">
        <div>
          <p className="text-sm font-semibold">Appearance</p>
          <p className="text-xs text-muted">Switch light / dark theme</p>
        </div>
        <ThemeToggle />
      </section>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <ShieldIcon className="h-4 w-4 shrink-0 text-brand" /> easy · Secured by Paystack · Made in Ghana 🇬🇭
      </p>
    </Page>
  )
}
