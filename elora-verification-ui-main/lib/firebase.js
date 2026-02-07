// lib/firebase.js - ROBUST INITIALIZATION
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if we have valid config
const hasConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== "mock-api-key-for-ui-preview";

let app = null;
let auth = null;
let db = null;
let storage = null;

// Mock Auth for UI Preview
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (cb) => {
    // Simulate auth check delay
    setTimeout(() => cb(null), 500);
    return () => {};
  },
  onIdTokenChanged: () => () => {},
  signInWithEmailAndPassword: async () => { throw new Error("Demo Mode: Auth disabled"); },
  signOut: async () => {},
};

if (hasConfig) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (e) {
    console.warn("Firebase initialization failed:", e);
    // Fallback to null/mock
    auth = mockAuth;
  }
} else {
  console.log("Running in Demo/Preview Mode (Firebase disabled)");
  auth = mockAuth;
}

export { app, auth, db, storage };
export default app;
