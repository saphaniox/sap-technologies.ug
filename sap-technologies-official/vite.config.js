import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["ads.txt", "robots.txt", "images/logo.png", "favicon-16x16.png", "favicon-32x32.png", "favicon-48x48.png", "apple-touch-icon.png", "mstile-150x150.png", "pwa-192.png", "pwa-512.png", "maskable-192.png", "maskable-512.png"],
      manifest: {
        name: "SAPTech Uganda",
        short_name: "SAPTech",
        description: "Professional in Engineering & Technology solutions",
        theme_color: "#1a237e",
        background_color: "#0f172a",
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        categories: ["business", "technology"],
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallbackDenylist: [
          /^\/ads\.txt(?:$|\?)/,
          /^\/robots\.txt(?:$|\?)/,
          /^\/sitemap\.xml(?:$|\?)/,
          /^\/manifest\.webmanifest(?:$|\?)/,
          /^\/google-verification-template\.html(?:$|\?)/
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sap-technologies-ug\.onrender\.com\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 80, maxAgeSeconds: 600 },
              networkTimeoutSeconds: 8
            }
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "cloudinary-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 2592000 } // 30 days
            }
          },
          {
            // Cache the API server health/wake-up endpoint with StaleWhileRevalidate
            urlPattern: /^https:\/\/sap-technologies-ug\.onrender\.com\/api\/health/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "health-cache",
              expiration: { maxEntries: 1, maxAgeSeconds: 60 }
            }
          }
        ]
      }
    })
  ],
  // Suppress esbuild warning about '//' in SVG data URIs inside CSS
  esbuild: {
    logOverride: { 'js-comment-in-css': 'silent' }
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    cssCodeSplit: true,        // Split CSS per-chunk so unused styles don't block paint
    chunkSizeWarningLimit: 1600,
    target: 'es2020',          // Modern target = smaller output, no legacy polyfills
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Keep React + all its low-level deps together to prevent circular chunk loading
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/react-is/')
          ) return 'vendor';
          if (id.includes('framer-motion')) return 'motion';
          if (
            id.includes('/three/') ||
            id.includes('/@react-three/')
          ) return 'three';
          if (id.includes('/sweetalert2/')) return 'sweetalert';
          // No catch-all — let Rollup auto-bundle the rest to avoid circular deps
        }
      }
    }
  }
})
