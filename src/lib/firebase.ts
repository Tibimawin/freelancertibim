import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";
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
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
// Firestore com cache persistente (novo API)
// Usa cache local persistente com gerenciador de aba única para evitar conflitos
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
});
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