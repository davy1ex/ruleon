import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyTheme, DEFAULT_SETTINGS } from "./store/settingsStore";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import "./index.css";

applyTheme(DEFAULT_SETTINGS.theme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
