import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/elyby-auth': {
        target: 'https://authserver.ely.by',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/elyby-auth/, ''),
      },
      '/api/elyby-skins': {
        target: 'https://skinsystem.ely.by',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/elyby-skins/, ''),
      },
    },
  },
})
