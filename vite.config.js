import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiBaseUrl = (env.VITE_API_BASE_URL || 'https://student-management-system-wvmf.onrender.com')
    .replace(/\/+$/, '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
