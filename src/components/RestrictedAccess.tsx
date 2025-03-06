"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { motion } from "framer-motion";

interface RestrictedAccessProps {
  children: React.ReactNode;
}

export default function RestrictedAccess({ children }: RestrictedAccessProps) {
  const { user } = useAuth();
  const [accessStatus, setAccessStatus] = useState<'checking' | 'granted' | 'denied' | 'trolling'>('checking');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    address: "",
    reason: "",
    favoriteColor: "",
    petName: "",
    motherMaidenName: "",
    firstSchool: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);

  // Cette fonction vérifie rapidement le statut de l'utilisateur pour décider de la marche à suivre
  useEffect(() => {
    const quickCheck = async () => {
      // Pas d'utilisateur = pas d'accès
      if (!user) {
        setAccessStatus('denied');
        return;
      }

      try {
        // Vérifier immédiatement si l'utilisateur est whitelisté
        const userDoc = await getDoc(doc(db, "collections", user.uid));
        
        if (userDoc.exists() && userDoc.data().isWhitelisted === true) {
          // Utilisateur whitelisté = accès immédiat
          setAccessStatus('granted');
        } else {
          // Utilisateur non whitelisté = début du processus de trolling
          setAccessStatus('trolling');
          startTrolling();
        }
      } catch (error) {
        console.error("Error checking whitelist status:", error);
        setAccessStatus('denied');
      }
    };

    quickCheck();
  }, [user]);

  // Cette fonction démarre l'animation longue pour les utilisateurs non whitelistés
  const startTrolling = () => {
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 200);  // 20 secondes total

    return () => clearInterval(progressInterval);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const submitInterval = setInterval(() => {
      setSubmitProgress(prev => {
        if (prev >= 100) {
          clearInterval(submitInterval);
          window.location.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
          return 100;
        }
        return prev + 5;
      });
    }, 1000);
  };

  // Différentes vues selon le statut d'accès

  // Utilisateur whitelisté - accès immédiat
  if (accessStatus === 'granted') {
    return <>{children}</>;
  }

  // Vérification initiale
  if (accessStatus === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Non connecté - afficher message simple
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6">
          Accès Restreint
        </h1>
        <p className="text-center max-w-md">
          Veuillez vous connecter pour accéder à cette section.
        </p>
      </div>
    );
  }

  // En processus de trolling - afficher barre de chargement puis formulaire
  if (accessStatus === 'trolling') {
    // Si chargement terminé mais pas encore en train de soumettre
    if (loadingProgress >= 100 && !isSubmitting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
          <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-6 text-center">Formulaire d&apos;accès</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}*
                  </label>
                  <input
                    type={key === "birthDate" ? "date" : key === "email" ? "email" : "text"}
                    required
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg"
                    value={value}
                    onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Continuer
              </button>
            </form>
          </div>
        </div>
      );
    }
    
    // Si en train de soumettre le formulaire
    if (isSubmitting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
          <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-center">Traitement de votre demande</h2>
            <div className="bg-gray-700 rounded-full h-4 mb-4">
              <motion.div 
                className="h-full bg-green-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${submitProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-center text-gray-300 mt-2">
              {submitProgress}%
            </p>
          </div>
        </div>
      );
    }
    
    // Afficher la barre de progression pendant le chargement
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="w-full max-w-md">
          <h2 className="text-xl font-bold text-white text-center mb-8">
            Vérification des autorisations...
          </h2>
          <div className="bg-gray-700/50 rounded-full h-4 mb-4 overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-white mt-4">{loadingProgress}%</p>
          <p className="text-center text-gray-400 text-sm mt-2">
            Vérification de vos accès en cours...
          </p>
        </div>
      </div>
    );
  }

  // Utilisateur connecté mais accès refusé
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6">
        Accès Restreint
      </h1>
      <p className="text-center max-w-md">
        Vous n&apos;avez pas les autorisations nécessaires pour accéder à cette section.
      </p>
    </div>
  );
}
