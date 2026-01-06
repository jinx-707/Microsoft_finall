import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: 'src/apps/admin-dashboard',
  build: {
    outDir: '../../../dist/admin-dashboard'
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'https://sensesafe-c9c8bpend7cceeh7.eastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'https://sensesafe-c9c8bpend7cceeh7.eastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'https://sensesafe-c9c8bpend7cceeh7.eastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})

