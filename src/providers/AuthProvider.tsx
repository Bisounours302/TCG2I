"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { initializeFirebase } from "@/lib/firebaseConfig";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isWhitelisted: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isWhitelisted: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [, setFirebase] = useState<Awaited<ReturnType<typeof initializeFirebase>> | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const fb = await initializeFirebase();
      setFirebase(fb);

      if (fb.auth) {
        const unsubscribe = onAuthStateChanged(fb.auth, async (currentUser) => {
          setUser(currentUser);
          
          if (currentUser) {
            // Écouter les changements de whitelist
            const userDocRef = doc(fb.db, "collections", currentUser.uid);
            const unsubscribeDoc = onSnapshot(userDocRef, (doc) => {
              if (doc.exists()) {
                setIsWhitelisted(doc.data()?.isWhitelisted || false);
              }
            });
            return () => unsubscribeDoc();
          }
          
          setLoading(false);
        });

        return () => unsubscribe();
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isWhitelisted }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
