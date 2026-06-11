import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyTheme, DEFAULT_SETTINGS } from "./store/settingsStore";
import "./index.css";

applyTheme(DEFAULT_SETTINGS.theme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
