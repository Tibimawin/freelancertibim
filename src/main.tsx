import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import './i18n.ts';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="freelancer-theme">
    <App />
  </ThemeProvider>
);