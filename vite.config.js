import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/web/biblezoom_test/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  server: {
    proxy: {
      '/api/cafe24Products': {
        target: 'http://127.0.0.1:5005',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/cafe24Products/, '/biblefont/us-central1/cafe24ProductsTest'),
      },
    },
  },
})
