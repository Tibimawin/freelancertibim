import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error('Configuração do Firebase ausente. Defina variáveis VITE_FIREBASE_* no seu .env.local.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics safely (some mobile browsers/WebViews block gtag/cookies)
let analytics: any = null;
try {
  // Only attempt in browser contexts
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn('Analytics não disponível neste ambiente:', e);
}

// Initialize Firebase services
export const auth = getAuth(app);
// Firestore com cache persistente (novo API) — com fallback quando IndexedDB/local persistence não está disponível
let _db: any = null;
try {
  _db = initializeFirestore(app, {
    // Habilita sincronização multi-aba para evitar erro de "exclusive access"
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (e) {
  console.warn('Falha ao inicializar Firestore com cache persistente, usando fallback:', e);
  try {
    _db = getFirestore(app);
  } catch (e2) {
    console.error('Falha ao inicializar Firestore:', e2);
  }
}
export const db = _db;
export const storage = getStorage(app);
export const functions = getFunctions(app);
// Inicialização segura do RTDB: ambiente pode não ter o serviço disponível
let _rtdb: any = null;
try {
  _rtdb = getDatabase(app);
} catch (e) {
  console.warn('Realtime Database não disponível neste ambiente:', e);
}
export const rtdb = _rtdb;

export default app;