import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes.jsx'
import './index.css'

// vite-react-ssg owns mounting: it renders to #root on the client (and hydrates
// the prerendered HTML in production), and renders each route to static HTML at
// build time. Providers live in the root layout (App.jsx).
export const createRoot = ViteReactSSG({ routes })
