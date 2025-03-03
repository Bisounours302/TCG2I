"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isWhitelisted: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isWhitelisted: false
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, "collections", user.uid);
        const userDoc = await getDoc(userRef);
        const whitelisted = userDoc.exists() && userDoc.data().isWhitelisted === true;
        setIsWhitelisted(whitelisted);

        if (!whitelisted && pathname !== "/maintenance") {
          router.push("/maintenance");
        }
      } else if (pathname !== "/maintenance") {
        router.push("/maintenance");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, loading, isWhitelisted }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
