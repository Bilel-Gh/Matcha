import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permet l'accès depuis l'extérieur
    port: 80,   // Port à utiliser
    watch: {
      usePolling: true // Nécessaire pour les volumes Docker
    }
  }
})
