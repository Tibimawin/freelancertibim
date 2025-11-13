import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importe seus arquivos de tradução
import translationEN from './locales/en/translation.json';
import translationPTBR from './locales/pt-BR/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  'pt-BR': {
    translation: translationPTBR
  }
};

i18n
  .use(LanguageDetector) // Detecta o idioma do navegador
  .use(initReactI18next) // Passa a instância do i18n para react-i18next
  .init({
    resources,
    lng: 'pt-BR', // Definindo pt-BR como idioma inicial
    fallbackLng: 'pt-BR', // Idioma padrão caso o detectado não esteja disponível
    supportedLngs: ['pt-BR', 'en'], // Idiomas suportados
    debug: false, // Mude para true para ver logs de debug no console
    interpolation: {
      escapeValue: false, // Não escapa HTML, já que o React já faz isso
    },
    detection: {
      order: ['localStorage'], // Prioriza preferência do usuário; sem override por navegador
      caches: ['localStorage'], // Armazena o idioma detectado no localStorage
    }
  });

export default i18n;