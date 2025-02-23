"use client"; // Obligatoire pour les hooks dans App Router

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe(); // Nettoyage du listener à l'unmount
  }, []);

  return { user, loading };
}
