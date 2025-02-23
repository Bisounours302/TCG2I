"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface Card {
  id: string;
  name: string;
  imageURL: string;
  isFlipped: boolean;
  isMatched: boolean;
  uniqueId: string;
}

export default function MemoryPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const totalImages = 16; // 16 cartes + 1 image de dos

  // Récupérer 8 cartes aléatoires depuis l'API
  const fetchCards = async () => {
    setIsLoading(true);
    setImagesLoaded(0);
    setIsGameOver(false);

    try {
      const res = await fetch("/api/memory-cards");
      if (!res.ok) throw new Error("Erreur chargement cartes");
      const data = await res.json();

      const formattedCards = data.cards.map((card: Card, index: number) => ({
        ...card,
        isFlipped: false,
        isMatched: false,
        uniqueId: `${card.id}-${index}`,
      }));

      setCards(formattedCards);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // Précharge toutes les images avant de commencer le jeu
  useEffect(() => {
    if (cards.length === 16) {
      const preloadImages = [...cards.map((c) => c.imageURL), "/ressources/card-back.png"].map(
        (src) =>
          new Promise<void>((resolve) => {
            const img = new window.Image();
            img.src = src;
            img.onload = () => {
              setImagesLoaded((prev) => prev + 1);
              resolve();
            };
          })
      );

      Promise.all(preloadImages).then(() => setIsLoading(false));
    }
  }, [cards]);

  // Gérer le retournement des cartes
  const handleCardClick = (index: number) => {
    if (isChecking || selectedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched || isLoading)
      return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    setSelectedCards([...selectedCards, index]);

    if (selectedCards.length === 1) {
      setIsChecking(true); // Empêche le clic pendant la vérification
      setTimeout(() => checkMatch(selectedCards[0], index), 2000); // Vérifie après 2 secondes
    }
  };

  // Vérifier si les cartes sont identiques
  const checkMatch = (firstIndex: number, secondIndex: number) => {
    const newCards = [...cards];

    if (newCards[firstIndex].id === newCards[secondIndex].id) {
      newCards[firstIndex].isMatched = true;
      newCards[secondIndex].isMatched = true;
    } else {
      newCards[firstIndex].isFlipped = false;
      newCards[secondIndex].isFlipped = false;
    }

    setCards(newCards);
    setSelectedCards([]);
    setIsChecking(false);

    if (newCards.every((card) => card.isMatched)) {
      setIsGameOver(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold text-blue-400 mb-6">🃏 Jeu de Memory</h1>

      {isGameOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-center text-xl font-semibold text-green-400"
        >
          🎉 Félicitations, vous avez gagné !
        </motion.div>
      )}

      {isLoading ? (
        <p className="text-gray-300">Chargement des cartes... ({imagesLoaded}/{totalImages})</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.uniqueId}
              className="relative w-24 h-32 md:w-32 md:h-44 cursor-pointer"
              onClick={() => handleCardClick(index)}
              initial={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Image
                src={card.isFlipped || card.isMatched ? card.imageURL : "/ressources/card-back.png"}
                alt="Card"
                fill
                className="object-cover rounded-lg border border-gray-500"
              />
            </motion.div>
          ))}
        </div>
      )}

      {(isGameOver || !isLoading) && (
        <motion.button
          onClick={fetchCards}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isGameOver ? "Rejouer" : "Réinitialiser"}
        </motion.button>
      )}
    </div>
  );
}
