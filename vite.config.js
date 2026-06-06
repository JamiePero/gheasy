import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
