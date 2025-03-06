"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";
import { User as UserIcon, Package } from "lucide-react";
import { initializeFirebase } from "@/lib/firebaseConfig";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [boosters, setBoosters] = useState(0);
  const [firebase, setFirebase] = useState<Awaited<ReturnType<typeof initializeFirebase>> | null>(null);

  useEffect(() => {
    const init = async () => {
      const fb = await initializeFirebase();
      setFirebase(fb);
      
      if (fb.auth) {
        const unsubscribe = onAuthStateChanged(fb.auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        return () => unsubscribe();
      }
    };
    
    init();
  }, []);

  // 🔥 Écoute en temps réel la collection de l'utilisateur
  useEffect(() => {
    if (!user || !firebase) return;

    const userRef = doc(firebase.db, "collections", user.uid);
    const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBoosters(data.nbBooster || 0);
      }
    });

    return () => unsubscribeSnapshot(); // Se désabonne du listener si l'utilisateur se déconnecte
  }, [user, firebase]);

  const handleSignIn = async () => {
    try {
      if (!firebase?.auth) return;
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebase.auth, provider);
      
      // Create initial user document if it doesn't exist
      if (result.user && firebase.db) {
        const userRef = doc(firebase.db, "collections", result.user.uid);
        const docSnap = await getDoc(userRef);
        
        if (!docSnap.exists()) {
          await setDoc(userRef, {
            nbBooster: 0,
            createdAt: new Date(),
            email: result.user.email,
            displayName: result.user.displayName
          });
        }
      }
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      if (firebase?.auth) {
        await signOut(firebase.auth);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {loading ? (
        <p className="text-gray-400">...</p>
      ) : user ? (
        <>
          <div className="relative flex items-center gap-2">
            <Package className="text-yellow-400 w-6 h-6" />
            <span className="text-white">{boosters}</span>
          </div>
          <img
            src={user.photoURL || "/default-avatar.png"}
            alt="Photo de profil"
            className="w-10 h-10 rounded-full cursor-pointer border-2 border-white hover:border-red-500 transition-all"
            onClick={handleSignOut}
            title="Se déconnecter"
          />
        </>
      ) : (
        <button
          onClick={handleSignIn}
          className="w-10 h-10 flex items-center justify-center bg-gray-600 rounded-full hover:bg-gray-500 transition"
        >
          <UserIcon className="text-white w-6 h-6" />
        </button>
      )}
    </div>
  );
}