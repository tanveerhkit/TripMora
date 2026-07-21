import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// During local dev the frontend runs on Vite's port while the AI route lives on
// the Vercel dev server (`vercel dev`, port 3000). The proxy lets the browser
// keep calling a relative `/api/...` URL in both dev and production.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
