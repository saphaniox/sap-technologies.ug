import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

const clean = (value) => String(value || "").trim();
const toBoolean = (value) => ["1", "true", "yes", "on"].includes(clean(value).toLowerCase());
const escapeHtmlAttribute = (value) => clean(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, ".", "");
  const provider = clean(env.VITE_AD_PROVIDER || env.VITE_AD_NETWORK || "monetag").toLowerCase();
  const disabled = toBoolean(env.VITE_AD_DISABLED || env.VITE_ADS_DISABLED);
  const enabledInDev = toBoolean(env.VITE_AD_ENABLE_IN_DEV || env.VITE_ADS_ENABLE_IN_DEV);
  const autoEnabled = toBoolean(env.VITE_AD_AUTO || env.VITE_AD_AUTO_ADS || "true");
  const adsEnabled = provider !== "none" && provider !== "off" && provider !== "disabled" &&
    !disabled && autoEnabled && (command === "build" || enabledInDev);
  const adScriptUrl = clean(
    env.VITE_AD_SCRIPT_URL ||
      (provider === "monetag" ? env.VITE_MONETAG_SCRIPT_URL || "https://quge5.com/88/tag.min.js" : "") ||
      (provider === "adsterra" ? env.VITE_ADSTERRA_SCRIPT_URL : "")
  );
  const adZoneId = clean(
    env.VITE_AD_ZONE_ID ||
      env.VITE_MONETAG_ZONE_ID ||
      env.VITE_ADSTERRA_ZONE_ID ||
      (provider === "monetag" ? "11767557" : "")
  );
  const adSdkName = clean(env.VITE_AD_SDK_NAME || env.VITE_MONETAG_SDK_NAME);
  const adCfasync = clean(env.VITE_AD_CFASYNC || env.VITE_MONETAG_CFASYNC || "false");
  const adHeadScript = {
    name: "ad-network-head-script",
    transformIndexHtml(html) {
      if (!adsEnabled || !adScriptUrl) return html;

      const attributes = [
        `src="${escapeHtmlAttribute(adScriptUrl)}"`,
        "async"
      ];
      if (adZoneId) attributes.push(`data-zone="${escapeHtmlAttribute(adZoneId)}"`);
      if (adSdkName) attributes.push(`data-sdk="${escapeHtmlAttribute(adSdkName)}"`);
      if (adCfasync) attributes.push(`data-cfasync="${escapeHtmlAttribute(adCfasync)}"`);

      return html.replace("<head>", `<head>\n    <script ${attributes.join(" ")}></script>`);
    }
  };

  return {
  plugins: [
    react(),
    adHeadScript,
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      filename: "pwa-sw.js",
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
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallbackDenylist: [
          /^\/ads\.txt(?:$|\?)/,
          /^\/robots\.txt(?:$|\?)/,
          /^\/sitemap\.xml(?:$|\?)/,
          /^\/manifest\.webmanifest(?:$|\?)/,
          /^\/sw\.js(?:$|\?)/,
          /^\/pwa-sw\.js(?:$|\?)/,
          /^\/google-verification-template\.html(?:$|\?)/
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(?:api\.saptechug\.com|sap-technologies-ug\.onrender\.com)\/api\//,
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
            urlPattern: /^https:\/\/(?:api\.saptechug\.com|sap-technologies-ug\.onrender\.com)\/api\/health/,
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
  };
});
