import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite' // 1. BẮT BUỘC PHẢI IMPORT
import { fileURLToPath, URL } from "node:url"; // Thêm thư viện này để xử lý đường dẫn

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // 2. THÊM CẤU HÌNH RESOLVE ALIAS TẠI ĐÂY
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})