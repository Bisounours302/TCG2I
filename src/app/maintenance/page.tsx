"use client";

import { useAuth } from "@/src/providers/AuthProvider";
import Image from "next/image";

export default function MaintenancePage() {
  const { user, isWhitelisted } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <Image
          src="/ressources/LOGO.png"
          alt="Logo"
          width={300}
          height={120}
          className="mx-auto mb-8"
        />
        
        <h1 className="text-4xl md:text-6xl text-white font-bold mb-4">
          Accès Restreint
        </h1>
        
        <p className="text-xl text-gray-400 mb-8">
          {!user 
            ? "Veuillez vous connecter pour accéder au site."
            : !isWhitelisted 
            ? "Votre compte n'est pas encore autorisé à accéder au site."
            : "Redirection..."}
        </p>

        {!user && (
          <div className="animate-pulse">
            <p className="text-blue-400 text-lg">
              Connectez-vous avec le bouton en haut à droite ↗️
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
