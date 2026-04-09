import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Écoute sur localhost ET sur le réseau
    port: 3000, // Port fixe souhaité
    strictPort: true, // Enforce: n'utilise pas un autre port
    open: true, // Ouvre automatiquement le navigateur
    cors: true, // Active CORS
    // Réglages pour améliorer HMR sur Windows/OneDrive
    watch: {
      usePolling: false,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 }
    }
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: true
  },
  // Pré-bundle des dépendances lourdes pour accélérer le cold start en dev
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      '@supabase/supabase-js',
      '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction', '@fullcalendar/list', '@fullcalendar/resource-timegrid',
      'recharts',
      'framer-motion',
      'lucide-react'
    ]
  },
  build: {
    sourcemap: false, // Désactiver pour de meilleures perfs de build (re-activer si nécessaire)
    chunkSizeWarningLimit: 1200, // 1.2MB
    rollupOptions: {
      output: {
        // Découpage plus fin pour réduire le bundle initial et améliorer le cache
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-fullcalendar': [
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/timegrid',
            '@fullcalendar/interaction',
            '@fullcalendar/list',
            '@fullcalendar/resource-timegrid'
          ],
          'vendor-recharts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'icons': ['lucide-react']
        }
      }
    }
  }
})
