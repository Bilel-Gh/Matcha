import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permet l'accès depuis l'extérieur du conteneur
    port: 8080, // Port à utiliser (cohérent avec Docker)
    strictPort: true, // Échoue si le port n'est pas disponible
    watch: {
      usePolling: true, // Nécessaire pour les volumes Docker
      interval: 1000    // Intervalle de polling en ms
    },
    hmr: {
      port: 8080 // Port pour Hot Module Replacement
    }
  }
})
