import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.ico",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-maskable-512x512.png",
      ],

      manifest: {
        name: "Kiêu Giang - Quản lý nhà trọ",
        short_name: "Kiêu Giang",
        description: "Hệ thống quản lý nhà trọ Kiêu Giang",
        start_url: "/login",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#ffffff",

        icons: [
          {
            src: "/icon-logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-logo.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});