import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import BundleCard from '../components/BundleCard.jsx'
import NetworkPicker, { NetworkBadge } from '../components/NetworkPicker.jsx'
import PhoneInput from '../components/PhoneInput.jsx'
import { formatCedis, getNetwork, isValidGhPhone, normalizePhone, prettyPhone } from '../lib/format.js'
import { deriveVolumeLabel } from '../lib/api.js'
import { setSupportContact } from '../lib/support.js'
import { track } from '../lib/analytics.js'
import { getProfile, saveProfile } from '../lib/store.js'
import { AlertIcon, ShieldIcon } from '../components/icons.jsx'

export default function Store() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [storeInfo, setStoreInfo] = useState(null)
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [network, setNetwork] = useState('mtn')
  const [phone, setPhone] = useState(() => getProfile().phone || '')
  const [selectedId, setSelectedId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [triedSubmit, setTriedSubmit] = useState(false)

  useEffect(() => {
    setLoading(true)
    setLoadError('')
    fetch(`https://api.getflashx.com/gheasy/store/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || 'Store not found')
        setStoreInfo(data.store)
        setBundles(data.bundles || [])
      })
      .catch((e) => setLoadError(e.message || 'Could not load store.'))
      .finally(() => setLoading(false))
  }, [slug])

  // Point the floating support button at THIS agent's WhatsApp while the store is
  // open; if they never set one, leave it on the default easy support line.
  useEffect(() => {
    if (storeInfo?.supportWhatsapp) {
      setSupportContact({
        number: storeInfo.supportWhatsapp,
        message: `Hi, I need help with my data purchase from ${storeInfo.storeName || 'your store'}`,
      })
    } else {
      setSupportContact(null)
    }
    return () => setSupportContact(null)
  }, [storeInfo])

  // Reset selection when network changes
  useEffect(() => { setSelectedId(null) }, [network])

  // Reset submitting when returning from Paystack
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') setSubmitting(false)
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // Per-store PWA manifest (FIX 1): "Add to Home Screen" on a store page should
  // open that store, not the agent landing. Inject a same-origin blob manifest
  // with start_url = /store/{slug}, plus iOS standalone meta tags. Restored on unmount.
  useEffect(() => {
    if (typeof document === 'undefined' || !slug) return
    const origin = window.location.origin
    const startUrl = `${origin}/store/${slug}`
    const manifest = {
      name: storeInfo?.storeName ? `${storeInfo.storeName} — easy` : 'easy store',
      short_name: (storeInfo?.storeName || 'easy').slice(0, 12),
      description: 'Buy data bundles on easy. No login.',
      start_url: startUrl,
      scope: startUrl,
      display: 'standalone',
      background_color: '#030706',
      theme_color: '#030706',
      orientation: 'portrait',
      icons: [
        { src: `${origin}/easytra.png`, sizes: '192x192', type: 'image/png' },
        { src: `${origin}/easytra.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    }
    const blobUrl = URL.createObjectURL(
      new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }),
    )
    let link = document.querySelector('link[rel="manifest"]')
    const prevHref = link?.getAttribute('href') || null
    const createdLink = !link
    if (!link) {
      link = document.createElement('link')
      link.rel = 'manifest'
      document.head.appendChild(link)
    }
    link.setAttribute('href', blobUrl)

    const metas = []
    const upsertMeta = (name, content) => {
      let m = document.querySelector(`meta[name="${name}"]`)
      const existed = !!m
      if (!m) {
        m = document.createElement('meta')
        m.setAttribute('name', name)
        document.head.appendChild(m)
      }
      metas.push({ m, prev: m.getAttribute('content'), existed })
      m.setAttribute('content', content)
    }
    upsertMeta('apple-mobile-web-app-capable', 'yes')
    upsertMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')
    upsertMeta('apple-mobile-web-app-title', storeInfo?.storeName || 'easy')

    return () => {
      URL.revokeObjectURL(blobUrl)
      if (createdLink) link.remove()
      else if (prevHref) link.setAttribute('href', prevHref)
      metas.forEach(({ m, prev, existed }) => {
        if (!existed) m.remove()
        else if (prev != null) m.setAttribute('content', prev)
      })
    }
  }, [slug, storeInfo])

  const filteredBundles = bundles
    .filter((b) => b.network === network || (network === 'airteltigo_ishare' && b.network === 'airteltigo_ishare') || (network === 'airteltigo_bigtime' && b.network === 'airteltigo_bigtime'))
    .sort((a, b) => a.sellPrice - b.sellPrice)

  const selectedBundle = filteredBundles.find((b) => (b.id || b.name) === selectedId) || null
  const phoneValid = isValidGhPhone(phone)
  const canPay = phoneValid && !!selectedBundle && !submitting
  const net = getNetwork(network)

  async function handlePay() {
    setTriedSubmit(true)
    setSubmitError('')
    if (!phoneValid || !selectedBundle) return
    setSubmitting(true)
    try {
      const cleanPhone = normalizePhone(phone)
      const res = await fetch(`https://api.getflashx.com/gheasy/store/${slug}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: cleanPhone,
          networkType: selectedBundle.network,
          volumeInMB: selectedBundle.volumeInMB,
          gbAmount: selectedBundle.gbAmount,
          bundleName: selectedBundle.name,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to initiate payment')
      const url = data.paymentUrl || data.authorization_url
      if (!url) throw new Error('No payment link returned. Please try again.')
      saveProfile({ phone: cleanPhone })
      track('store_purchase_initiated', { slug, network, bundle: selectedBundle.name, amount: selectedBundle.sellPrice })
      window.location.href = url
    } catch (e) {
      setSubmitError(e.message || 'Payment could not be started. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Page className="wrap max-w-lg pb-32 pt-10">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-3xl border border-border bg-surface" />
          ))}
        </div>
      </Page>
    )
  }

  if (loadError) {
    return (
      <Page className="wrap max-w-lg pb-32 pt-10 text-center">
        <div className="rounded-3xl border border-border bg-surface p-10">
          <p className="text-4xl">😕</p>
          <h1 className="mt-4 text-xl font-bold">Store not found</h1>
          <p className="mt-2 text-sm text-muted">{loadError}</p>
          <Button onClick={() => navigate('/')} className="mx-auto mt-6">Go home</Button>
        </div>
      </Page>
    )
  }

  return (
    <Page className="wrap max-w-lg pb-44 pt-6">
      {/* Store header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">easy store</p>
        <h1 className="text-2xl font-bold tracking-tight">{storeInfo?.storeName}</h1>
      </div>

      {/* Network picker */}
      <section className="mb-5">
        <h2 className="mb-3 text-sm font-semibold text-fg">1. Choose network</h2>
        <NetworkPicker value={network} onChange={setNetwork} />
      </section>

      {/* Phone */}
      <section className="mb-5">
        <h2 className="mb-3 text-sm font-semibold text-fg">2. Recipient number</h2>
        <PhoneInput
          value={phone}
          onChange={setPhone}
          error={triedSubmit && !phoneValid ? 'Enter a valid Ghana number.' : ''}
        />
      </section>

      {/* Bundles */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-fg">3. Choose a bundle</h2>
        {filteredBundles.length === 0 ? (
          <p className="text-sm text-muted">No {net.label} bundles available right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredBundles.map((b) => (
              <BundleCard
                key={b.id || b.name}
                bundle={{ ...b, id: b.id || b.name, sellPrice: b.sellPrice, volume: deriveVolumeLabel(b) }}
                active={(b.id || b.name) === selectedId}
                onSelect={() => {
                  setSelectedId(b.id || b.name)
                  setSubmitError('')
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pay — desktop keeps the inline button; mobile uses the floating bar below */}
      <div className="hidden md:block">
        {submitError && (
          <p className="mb-4 flex items-start gap-1.5 rounded-xl bg-red-500/10 p-3 text-xs font-medium text-red-500">
            <AlertIcon className="mt-px h-4 w-4 shrink-0" />
            {submitError}
          </p>
        )}

        <Button onClick={handlePay} disabled={!canPay} loading={submitting} size="lg" className="w-full">
          {selectedBundle ? `Pay ${formatCedis(selectedBundle.sellPrice)}` : 'Select a bundle'}
        </Button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldIcon className="h-4 w-4 text-brand" />
          Secured by Paystack
        </p>
      </div>

      {/* Mobile floating Pay bar — appears when a bundle is selected */}
      <AnimatePresence>
        {selectedBundle && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-border glass px-3 pt-2.5 md:hidden"
            style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted">
                  {selectedBundle.name} · {net.label}
                  {phoneValid ? ` · ${prettyPhone(phone)}` : ''}
                </p>
                <p className="font-display text-xl font-bold leading-tight tnum text-fg">
                  {formatCedis(selectedBundle.sellPrice)}
                </p>
              </div>
              <Button onClick={handlePay} disabled={!canPay} loading={submitting} size="md" className="shrink-0">
                Pay now
              </Button>
            </div>
            {submitError && (
              <p className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-red-500/10 py-2 text-center text-xs font-medium text-red-500">
                <AlertIcon className="h-4 w-4 shrink-0" />
                {submitError}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  )
}