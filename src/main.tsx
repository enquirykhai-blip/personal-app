import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AppDataProvider } from "./store.tsx";

/* App is meant to feel static, like an installed app, not a zoomable page. */
window.addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), { passive: false });
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && ["=", "-", "+", "0"].includes(e.key)) e.preventDefault();
});
document.addEventListener("gesturestart", (e) => e.preventDefault());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppDataProvider>
      <App />
    </AppDataProvider>
  </StrictMode>,
);
