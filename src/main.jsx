import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.jsx";

registerSW({
  immediate: true,

  onOfflineReady() {
    console.log("PWA đã sẵn sàng dùng offline cơ bản.");
  },

  onNeedRefresh() {
    console.log("Có phiên bản mới của ứng dụng.");
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);