import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite' // ✨ 이거 한 줄 추가!
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()
     // ✨ 여기도 추가!
     ],
     server: {
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://localhost:8080', // 💡 실제 Java 서버 주소 (8080 확인 필요)
          changeOrigin: true,
          secure: false,
        },
      },
    },
  
})
