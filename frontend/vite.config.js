import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['car-wash.png'], 
      manifest: {
        name: 'Hoy No Circula CDMX',
        short_name: 'NoCircula',
        description: 'Consulta y gestión vehicular del programa Hoy No Circula.',
        theme_color: '#002244',
        background_color: '#1a1a1a',
        display: 'standalone',
        icons: [
          {
            src: 'car-wash.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'car-wash.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})