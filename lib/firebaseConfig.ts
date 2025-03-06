import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;
const provider = new GoogleAuthProvider();

async function initializeFirebase() {
  if (typeof window !== "undefined" && !getApps().length) {
    try {
      const response = await fetch('/api/auth/firebase-config');
      const firebaseConfig = await response.json();
      
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }
  return { app, db, auth, storage, provider };
}

// Initialiser Firebase immédiatement
if (typeof window !== "undefined") {
  initializeFirebase();
}

export { app, db, auth, storage, provider, initializeFirebase };
