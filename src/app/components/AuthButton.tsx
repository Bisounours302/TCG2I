"use client";

import { useState, useEffect, useCallback } from "react";
import { auth, db, provider } from "@/lib/firebaseConfig";
import { signInWithPopup, onAuthStateChanged, User, getAuth } from "firebase/auth";
import { doc, getDoc, setDoc,  onSnapshot, serverTimestamp } from "firebase/firestore";
import { User as UserIcon, Package } from "lucide-react";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [boosters, setBoosters] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await initializeUserData(firebaseUser.uid);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // 🔥 Écoute en temps réel la collection de l'utilisateur
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "collections", user.uid);
    const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBoosters(data.nbBooster || 0);
      }
    });

    return () => unsubscribeSnapshot(); // Se désabonne du listener si l'utilisateur se déconnecte
  }, [user]);

  // 📝 Initialise ou met à jour les données utilisateur
  const initializeUserData = async (userId: string) => {
    const userRef = doc(db, "collections", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const auth = getAuth();
      const user = auth.currentUser;
      const userName = user?.displayName || "Unknown";
      await setDoc(userRef, { nomJoueur: userName, nbBooster: 10, tempsRestant: serverTimestamp(), LastCollectedBoosterDate: serverTimestamp(), LastPlayedGameDate: serverTimestamp() });
    }
  };
  
  const handleLogin = useCallback(async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erreur lors de la connexion :", error);
        alert(`Erreur : ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Erreur lors de la déconnexion :", error);
        alert(`Erreur : ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
            onClick={handleLogout}
            title="Se déconnecter"
          />
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="w-10 h-10 flex items-center justify-center bg-gray-600 rounded-full hover:bg-gray-500 transition"
        >
          <UserIcon className="text-white w-6 h-6" />
        </button>
      )}
    </div>
  );
}
