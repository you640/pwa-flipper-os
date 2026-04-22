import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA: guard service worker registration against Lovable preview iframes
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("lovable.app");

if ((isPreviewHost || isInIframe) && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// Apply persisted theme as early as possible
const storedTheme = (localStorage.getItem("theme") as "dark" | "light" | "system" | null) ?? "dark";
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle(
  "dark",
  storedTheme === "dark" || (storedTheme === "system" && prefersDark),
);

createRoot(document.getElementById("root")!).render(<App />);
