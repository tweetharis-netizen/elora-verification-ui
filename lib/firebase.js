// lib/firebase.js - TEMPORARY BYPASS FOR UI PREVIEW
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "preview-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "preview.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "preview-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "preview.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456:web:abc123",
};

let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.warn("Firebase init failed", e);
  }
} else {
  app = getApp();
}

// Hard bypass for exports to prevent crash on invalid keys
const isPreview = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key-for-ui-preview" || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "preview-key";

// Mock Auth object to prevent "Cannot read properties of null" errors
const mockAuth = {
  onAuthStateChanged: (cb) => {
    // Just call with null user after a tiny delay to simulate "not logged in"
    setTimeout(() => cb(null), 0);
    return () => { }; // Return unsubscribe function
  },
  onIdTokenChanged: () => () => { },
  signOut: async () => { },
};

export const auth = isPreview ? mockAuth : (() => {
  try { return app ? getAuth(app) : mockAuth; } catch (e) { return mockAuth; }
})();
export const db = isPreview ? null : (() => {
  try { return app ? getFirestore(app) : null; } catch (e) { return null; }
})();
export const storage = isPreview ? null : (() => {
  try { return app ? getStorage(app) : null; } catch (e) { return null; }
})();

export { app };
export default app;
