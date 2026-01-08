import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Friendly validation to help catch env issues during development
const missing = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k);
if (missing.length > 0) {
  console.warn(
    "Firebase config missing env vars:",
    missing,
    "\nMake sure .env is present and EXPO_PUBLIC_* vars are loaded. See README or use expo config plugin to inject env variables."
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
