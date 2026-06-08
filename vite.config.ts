import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server : {
    port:5173,
    proxy:{
      '/api': {
          target: 'http://localhost:8080', // 💡 실제 Java 서버 주소 (8080 확인 필요)
          changeOrigin: true,
          secure: false,
      }
    },
  },
})
