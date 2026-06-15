// Site-wide configuration + SEO defaults.

export const SITE_URL = 'https://gheasy.com'
export const SITE_NAME = 'GhEasy'

export const DEFAULT_TITLE =
  'GhEasy — Buy MTN, Telecel & AirtelTigo Data Bundles in Ghana | No Login'

export const DEFAULT_DESCRIPTION =
  'Buy cheap MTN, Telecel & AirtelTigo data bundles in Ghana from GH₵1. Instant delivery via MoMo. No account needed — pick a bundle, pay, done. Ghana’s easiest data top-up.'

// Branded share image (existing asset). A dedicated 1200×630 og-image can be
// designed later; this guarantees a working preview today.
export const OG_IMAGE = `${SITE_URL}/easy-dark1.png`

// Network data-balance USSD codes, surfaced across the site.
export const BALANCE_CODES = [
  { network: 'MTN', code: '*138#' },
  { network: 'Telecel', code: '*126#' },
  { network: 'AirtelTigo', code: '*504#' },
]

// WhatsApp support — scaffolded behind a constant. Set this to the real number
// (digits only, international format e.g. '233539255071') to make the floating
// support button and success-screen link appear. Empty = button hidden.
export const WHATSAPP_NUMBER = '+233241880233'
export const WHATSAPP_DEFAULT_TEXT = 'Hi GhEasy, I need help with my order'
