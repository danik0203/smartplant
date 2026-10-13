import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg'],
      manifest: {
        id: '/',
        name: 'המשתלה הביתית - ניהול השקיה ורופא צמחים AI',
        short_name: 'המשתלה הביתית',
        description: 'אפליקציה חכמה לניהול השקיה, מעקב בריאות צמחים וזיהוי אוטומטי בעזרת AI לבית ולשותפים',
        theme_color: '#16a34a',
        background_color: '#0C1813',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        dir: 'rtl',
        lang: 'he',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'הוסף צמח בסריקת AI 📸',
            short_name: 'הוסף צמח',
            description: 'זיהוי והוספת צמח חדש באמצעות צילום AI',
            url: '/?action=add'
          },
          {
            name: 'צמחים שצריכים השקיה היום 💧',
            short_name: 'השקיה היום',
            description: 'צפייה בצמחים צמאים וסימון השקיה מהיר',
            url: '/?tab=dashboard'
          },
          {
            name: 'רופא הצמחים AI 🩺',
            short_name: 'רופא צמחים',
            description: 'אבחון בעיות עלים, השקיה ומזיקים מתמונה',
            url: '/?tab=doctor'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      }
    })
  ],
  server: {
    port: 3001,
    host: true
  }
});
