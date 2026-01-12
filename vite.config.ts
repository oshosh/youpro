import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // 백엔드 API 프록시 (youtubei.js 서버)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // 썸네일 프록시
      '/vi': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
