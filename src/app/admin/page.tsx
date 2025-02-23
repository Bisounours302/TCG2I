"use client";

import { useState } from "react";
import { addTestCards } from "@/src/app/actions/addCards";
import { deleteAllCards } from "@/src/app/actions/deleteAllCards";

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddCards = async () => {
    setLoading(true);
    setMessage("Ajout des cartes en cours...");
    await addTestCards();
    setLoading(false);
    setMessage("Cartes ajoutées !");
  };

  const handleDeleteCards = async () => {
    setLoading(true);
    setMessage("Suppression des cartes en cours...");
    const result = await deleteAllCards();
    setLoading(false);
    
    if (result.success) {
      setMessage("Toutes les cartes ont été supprimées !");
    } else {
      setMessage("Erreur lors de la suppression des cartes !");
    }
  };

  return (
    <div className="flex flex-col items-center p-10 gap-4">
      <h1 className="text-2xl font-bold">Admin - Gestion des Cartes</h1>
      {message && <p className="text-center text-lg text-blue-500">{message}</p>}
      <button 
        onClick={handleAddCards} 
        className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Ajout en cours..." : "Ajouter des cartes test"}
      </button>
      <button 
        onClick={handleDeleteCards} 
        className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Suppression en cours..." : "Supprimer toutes les cartes"}
      </button>
    </div>
  );
}
