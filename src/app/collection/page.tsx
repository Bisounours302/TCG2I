"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Card from "@/src/app/components/Card";

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
    const audio = new Audio("../ressources/carddeal.mp3");
    audio.volume = 0.1;
    audio.play();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserCollection(currentUser.uid);
        playCardDealSound(); // Jouer le son à l'ouverture de la collection
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

  const filteredCards = cards.filter((card) =>
    viewMode === "owned"
      ? card.quantity > 0
      : (card.rarity !== "secrete" && card.rarity !== "super-rare") || card.quantity > 0
  );

  const displayedCards = filteredCards.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);

  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    playCardDealSound(); // Jouer le son lors du changement de page
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-900 pt-24 pb-6 px-4 text-white">
      {loading ? (
        <div className="flex items-center justify-center text-lg">Loading...</div>
      ) : user ? (
        <>
          <button
            onClick={() => {
              setViewMode(viewMode === "owned" ? "all" : "owned");
              handlePageChange(0);
            }}
            className="px-4 py-2 bg-purple-600 text-white font-semibold mb-4"
          >
            {viewMode === "owned" ? "VOIR TOUTES LES CARTES" : "VOIR MES CARTES"}
          </button>

          {/* Grid des cartes optimisée */}
          <div className="w-full max-w-7xl px-4 flex justify-center">
            <div className="card-grid w-full h-full">
              {displayedCards.length > 0 ? (
                displayedCards.map((card) => (
                  <div key={card.id}>
                    <Card key={card.id} {...card} isRevealed={card.quantity > 0} isOwned={card.quantity > 0} />
                    <div className="flex items-center justify-center">
                      <p className="text-white text-lg">Exemplaires : {card.quantity}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center">Aucune carte.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => handlePageChange(0)}
              disabled={page === 0}
              className="px-2 py-1 bg-blue-500 disabled:bg-gray-600"
            >
              {"<<"}
            </button>
            <button
              onClick={() => handlePageChange(Math.max(page - 1, 0))}
              disabled={page === 0}
              className="px-2 py-1 bg-blue-500 disabled:bg-gray-600"
            >
              {"<"}
            </button>
            <p className="text-gray-400">
              Page {page + 1} sur {totalPages}
            </p>
            <button
              onClick={() => handlePageChange(Math.min(page + 1, totalPages - 1))}
              disabled={page + 1 >= totalPages}
              className="px-2 py-1 bg-blue-500 disabled:bg-gray-600"
            >
              {">"}
            </button>
            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={page + 1 >= totalPages}
              className="px-2 py-1 bg-blue-500 disabled:bg-gray-600"
            >
              {">>"}
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col justify-center text-center">
          <p className="text-gray-300 text-lg sm:text-xl mb-4">
            Please log in to view your collection.
          </p>
          <Link href="/">
            <button className="px-6 py-3 bg-blue-500 text-white font-semibold">
              Log In
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}