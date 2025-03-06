"use client"; // Obligatoire pour les hooks dans App Router

import { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { initializeFirebase } from "@/lib/firebaseConfig";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;
    
    const initAuth = async () => {
      try {
        const { auth } = await initializeFirebase();
        if (auth) {
          unsubscribe = onAuthStateChanged(auth, 
            (user) => {
              setUser(user);
              setLoading(false);
              setError(null);
            },
            (error) => {
              console.error("Auth error:", error);
              setError(error);
              setLoading(false);
            }
          );
        }
      } catch (error) {
        console.error("Init error:", error);
        setError(error as Error);
        setLoading(false);
      }
    };

    initAuth();
    return () => unsubscribe?.();
  }, []);

  return { user, loading, error };
}
