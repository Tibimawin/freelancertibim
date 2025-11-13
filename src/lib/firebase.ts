import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAdvDm7ayEA5WQbcXadapXgJAcDPvMt0ZM",
  authDomain: "freelincer-a4e3f.firebaseapp.com",
  projectId: "freelincer-a4e3f",
  storageBucket: "freelincer-a4e3f.firebasestorage.app",
  messagingSenderId: "58211617758",
  appId: "1:58211617758:web:5603c1c863b046d258ab4f",
  measurementId: "G-WTCHMPNJHX"
};

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
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
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