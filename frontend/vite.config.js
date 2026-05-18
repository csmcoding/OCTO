import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND = 'http://localhost:7823'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api':      BACKEND,
      '/health':   BACKEND,
      '/tree':     BACKEND,
      '/subtree':  BACKEND,
      '/scan':     BACKEND,
      '/open':     BACKEND,
      '/settings': BACKEND,
      '/preview':  BACKEND,
      '/git-diff': BACKEND,
      '/scan-info': BACKEND,
      // /node but NOT /node_modules (which Vite serves itself)
      '^/node(?!_modules)': { target: BACKEND, changeOrigin: true },
    },
  },
})
