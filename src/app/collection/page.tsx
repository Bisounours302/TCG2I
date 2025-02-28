"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Card from "../components/Card"; // Chemin corrigé

const CARDS_PER_PAGE = 12;

export default function CollectionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [cards, setCards] = useState<
    { id: string; name: string; imageURL: string; quantity: number; rarity: string }[]
  >([]);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState("owned");
  const [loading, setLoading] = useState(true);

  const playCardDealSound = () => {
    try {
      const audio = new Audio("/resources/carddeal.mp3"); // Chemin corrigé et normalisé
      audio.volume = 0.1;
      audio.play().catch(err => console.warn("Audio playback failed:", err));
    } catch (error) {
      console.warn("Error playing sound:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserCollection(currentUser.uid);
        playCardDealSound();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserCollection = async (userId: string) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "collections", userId));
      const userCards = userDoc.exists() ? userDoc.data().cards || {} : {};

      const cardsQuery = await getDocs(collection(db, "cards"));
      const allCards = cardsQuery.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        imageURL: doc.data().imageURL,
        quantity: userCards[doc.id] || 0,
        rarity: doc.data().rarity,
      }));

      setCards(allCards);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les cartes en fonction du mode d'affichage
  const filteredCards = cards.filter((card) =>
    viewMode === "owned"
      ? card.quantity > 0
      : card.rarity !== "secrete" || card.quantity > 0
  );

  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const displayedCards = filteredCards.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      playCardDealSound();
    }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-900 pt-24 pb-6 px-4 text-white">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-400 mb-4">
        🎴 Ma Collection de Cartes 🎴
      </h1>

      {loading ? (
        <div className="flex items-center justify-center h-64 w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : user ? (
        <>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <button
              onClick={() => {
                setViewMode(viewMode === "owned" ? "all" : "owned");
                setPage(0); // Reset page when changing view mode
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 transition-colors text-white font-semibold rounded"
            >
              {viewMode === "owned" ? "VOIR TOUTES LES CARTES" : "VOIR MES CARTES"}
            </button>
            
            <div className="text-gray-300">
              {filteredCards.length} carte{filteredCards.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Card grid */}
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full">
              {displayedCards.length > 0 ? (
                displayedCards.map((card) => (
                  <div key={card.id} className="flex flex-col items-center">
                    <Card 
                      id={card.id}
                      name={card.name}
                      imageURL={card.imageURL}
                      rarity={card.rarity}
                      isRevealed={card.quantity > 0 || (viewMode === "all" && card.rarity !== "secrete")}
                      isOwned={card.quantity > 0}
                    />
                    <div className="flex items-center justify-center mt-2">
                      <p className="text-gray-300 text-sm">
                        {card.quantity > 0 ? `×${card.quantity}` : viewMode === "all" ? "Non possédée" : ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center col-span-full py-8">
                  {viewMode === "owned" 
                    ? "Vous ne possédez aucune carte. Jouez pour en gagner !" 
                    : "Aucune carte trouvée."}
                </p>
              )}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 transition-colors rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <div className="flex items-center px-4">
                Page {page + 1} / {totalPages}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page + 1 >= totalPages}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 transition-colors rounded disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col justify-center text-center">
          <p className="text-gray-300 text-lg sm:text-xl mb-4">
            Veuillez vous connecter pour voir votre collection.
          </p>
          <Link href="/">
            <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 transition-colors rounded text-white font-semibold">
              Se connecter
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}