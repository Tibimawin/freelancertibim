import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
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
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;