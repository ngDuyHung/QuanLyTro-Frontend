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
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.js",
      registerType: "prompt",

      // THÊM ĐOẠN NÀY ĐỂ CHO PHÉP SW CHẠY LÚC NPM RUN DEV
      devOptions: {
        enabled: true,
        type: "module",
      },

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
        // Cấm PWA dùng index.html để fallback cho các file nằm trong thư mục assets (JS, CSS)
        navigateFallbackDenylist: [/^\/assets\//],
        // Giúp tối ưu hóa việc băm tài nguyên tĩnh của Vite, tránh lỗi tải cache cũ
        dontCacheBustURLsMatching: new RegExp(".+[.-][a-f0-9]{8}\\..+"),
        cleanupOutdatedCaches: true,
        // Tăng giới hạn dung lượng cache lên 5MB (Fix lỗi build trên Vercel)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },

      
    }),
  ],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // Tách code (Code Splitting) để tránh cảnh báo file bundle quá lớn
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Tách các thư viện (như React, UI framework) vào một file 'vendor.js'
            return "vendor";
          }
        },
      },
    },
  },
});
