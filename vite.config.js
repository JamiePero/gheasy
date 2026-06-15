import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static, SSR-safe routes to prerender to real HTML for crawlers. Dynamic /
// auth / user-specific routes (store/:slug, agent/*, order-status, history,
// more, buy-data, refer) keep working as the client-side SPA via the Vercel
// rewrite fallback.
const PRERENDER = [
  '/',
  '/about',
  '/how-it-works',
  '/faq',
  '/agents',
  '/mtn-bundles',
  '/telecel-bundles',
  '/airteltigo-bundles',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  ssgOptions: {
    script: 'async',
    dirStyle: 'nested', // /foo -> /foo/index.html (served cleanly by Vercel)
    entry: 'src/main.jsx',
    includedRoutes: (paths) => {
      const norm = (p) => {
        const clean = `/${String(p).replace(/^\/+|\/+$/g, '')}`
        return clean === '/' ? '/' : clean
      }
      return paths.filter((p) => PRERENDER.includes(norm(p)))
    },
  },
  server: {
    // Honour the PORT assigned by the launch/preview tooling; fall back to 5173.
    port: Number(process.env.PORT) || 5173,
    host: true,
  },
  preview: {
    // `vite preview` serves the production build; honour PORT too.
    port: Number(process.env.PORT) || 4173,
    host: true,
  },
})
