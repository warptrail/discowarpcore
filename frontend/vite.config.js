import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const env = globalThis.process?.env || {}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(env.VITE_PORT || 7611),
    strictPort: env.VITE_STRICT_PORT === 'true',
    proxy: {
      '/api': env.VITE_API_TARGET || 'http://127.0.0.1:7610',
      '/media': env.VITE_API_TARGET || 'http://127.0.0.1:7610',
    },
  },
})
