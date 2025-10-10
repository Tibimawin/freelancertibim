import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n.ts'; // Importe a configuração do i18n

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <ThemeProvider defaultTheme="system" storageKey="freelancer-theme">
      <App />
    </ThemeProvider>
  </I18nextProvider>
);