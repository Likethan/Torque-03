import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/')
          if (normalized.includes('/node_modules/three/') || normalized.includes('/node_modules/@react-three/')) {
            return 'vendor-three'
          }
          if (normalized.includes('/node_modules/gsap/') || normalized.includes('/node_modules/lenis/')) {
            return 'vendor-gsap'
          }
          if (normalized.includes('/node_modules/react/') || normalized.includes('/node_modules/react-dom/') || normalized.includes('/node_modules/scheduler/')) {
            return 'vendor-react'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
