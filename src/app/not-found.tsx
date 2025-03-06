"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <h1 className="text-6xl md:text-8xl text-white font-bold mb-4">404</h1>
        <h2 className="text-3xl md:text-4xl text-blue-400 font-semibold mb-8">
          Page introuvable
        </h2>
        <p className="text-xl text-gray-400 mb-8">
          Désolé, la page que vous recherchez n&apos;existe pas.
        </p>
        <Link 
          href="/"
          className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
