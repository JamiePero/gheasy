# GhEasy — Pay anything. Anytime.

A clean, mobile-first Ghanaian utility-payments web app. **Phase 1: data bundles.**
Buy MTN, Telecel & AirtelTigo data in seconds — no app, no login. Pick, pay, done.

Built with **React + Vite + Tailwind CSS**, with **framer-motion** for smooth,
native-feeling transitions. Light & dark themes, green (`#22C55E`) accent, deep-navy
(`#0F172A`) dark surface.

---

## Getting started

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

> Requires Node 18+.

---

## Design

- **Mobile-first, fintech feel** — on phones it behaves like a native app: a slim top
  bar, a sticky **bottom navigation** (Home · Buy · Orders · About), big tap targets,
  and a floating "Pay" bar during checkout.
- **Desktop is a full landing page** — sticky navbar, hero with an animated phone
  mockup, "how it works", networks, features, testimonials, and a footer.
- **Two themes** — clean light (white / slate-50) and deep-navy dark (`#0F172A`),
  switchable via the toggle (persisted to `localStorage`, respects OS preference on
  first visit). Colors are driven by CSS variables in `src/index.css` and exposed to
  Tailwind as semantic tokens (`bg`, `surface`, `card`, `border`, `fg`, `muted`).
- **Type** — Clash Display (headings) + Satoshi (body) via Fontshare.

---

## Pages

| Route            | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `/`              | Home — tagline, network selector, "Buy Data" CTA, full desktop landing  |
| `/buy-data`      | Select network → enter number → choose a bundle → pay via Paystack      |
| `/order-status`  | Check delivery by order reference / phone (auto-checks Paystack return) |
| `/about`         | What GhEasy is and the roadmap                                          |

`/buy-data?network=mtn|telecel|airteltigo` deep-links a pre-selected network.

---

## API integration (`src/lib/api.js`)

Base URL: `https://api.getflashx.com`

- **`GET /data/bundles?network=mtn`** — bundles are read from the `bundles[]` array;
  each card shows **`sellPrice`** formatted as Ghana Cedis (₵). Empty networks (e.g.
  AirtelTigo when out of stock) show a friendly empty state.
- **`POST /data/initiate-purchase`** — starts a Paystack checkout and redirects the
  customer to the returned authorization URL. A `callback_url` of
  `https://gheasy.com/order-status` (the current origin in dev) is sent so Paystack
  returns the customer to the order-status page.
- **`GET /data/order/{reference}`** — fetches delivery status; the order page maps the
  raw status to `success | processing | pending | failed` and auto-polls while pending.

### ⚠️ Note on `initiate-purchase` field names

The purchase endpoint returns `{"success":false,"error":"Missing required fields"}` and
its exact required field names are **not documented publicly**. `initiatePurchase()`
sends the bundle's own fields (network, volume, sellPrice, etc.) plus the recipient
phone, payer email and callback URL under the most likely key names. **If your backend
expects different keys, adjust the single `payload` object in `src/lib/api.js`** — it's
isolated and clearly commented for exactly this reason.

---

## Project structure

```
src/
  main.jsx            # entry + providers (Theme, Router)
  App.jsx             # layout chrome + animated routes
  theme.jsx           # light/dark theme context
  index.css           # Tailwind + theme tokens + utilities
  lib/
    api.js            # bundles / purchase / order-status client
    format.js         # networks, ₵ formatting, GH phone helpers
  components/         # Logo, Button, NetworkPicker, BundleCard, PhoneInput,
                      # Navbar, BottomNav, MobileHeader, Footer, ThemeToggle, …
  pages/              # Home, BuyData, OrderStatus, About, NotFound
```

---

Proudly built in Ghana 🇬🇭
