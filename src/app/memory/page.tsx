"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/src/hooks/useAuth";
import RestrictedAccess from "@/src/components/RestrictedAccess";

interface Card {
  id: string;
  name: string;
  imageURL: string;
  isFlipped: boolean;
  isMatched: boolean;
  uniqueId: string;
}

export default function MemoryPage() {
  return (
    <RestrictedAccess>
      <MemoryGame />
    </RestrictedAccess>
  );
}

function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isGameWon, setIsGameWon] = useState(false);
  const [isGameLost, setIsGameLost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [movesLeft, setMovesLeft] = useState(20);
  const [movesMade, setMovesMade] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const { user } = useAuth();
  const totalImages = 16; // 16 cartes + 1 image de dos

  // Ajoutez ces états pour stocker les valeurs de la base de données
  const [dailyGames, setDailyGames] = useState(0);

  // Récupérer 8 cartes aléatoires depuis l'API
  const fetchCards = async () => {
    setIsLoading(true);
    setImagesLoaded(0);
    setIsGameWon(false);
    setIsGameLost(false);
    setMovesLeft(15);
    setMovesMade(0);

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
    const checkLastPlayedGameDate = async () => {
      if (!user) return;
      const userDocRef = doc(db, "collections", user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const data = userDoc.data();
        const lastPlayedGameDate = data.LastPlayedGameDate.toDate();
        const today = new Date();
  
        if (lastPlayedGameDate.getDate() !== today.getDate()) {
          resetDailyStats();
        } else {
          // Récupérer les valeurs de la base de données
          setDailyGames(data.dailyGames || 0);
        }
      }
    };
  
    checkLastPlayedGameDate();
    fetchCards();
  }, [user]);

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

  const playFlipSound = () => {
    const audio = new Audio("../ressources/flipcard.mp3");
    audio.volume = 0.5;
    audio.play();
  };

  const playWinSound = () => {
    const audio = new Audio("../ressources/goodresult.mp3");
    audio.volume = 0.1;
    audio.play();
  };

  const playLoseSound = () => {
    const audio = new Audio("../ressources/negativebeeps.mp3");
    audio.volume = 0.1;
    audio.play();
  };

  const resetDailyStats = async () => {
    setDailyGames(0);
    if (user) {
      const userDocRef = doc(db, "collections", user.uid);
      await updateDoc(userDocRef, { dailyBoosters: 0, dailyGames: 0 });
    }
  };

  const updateLastPlayedGameDate = async () => {
    if (!user) return;
    const userDocRef = doc(db, "collections", user.uid);
    await updateDoc(userDocRef, { LastPlayedGameDate: new Date() });
  };

  // Gérer le retournement des cartes
  const handleCardClick = (index: number) => {
    if (isChecking || selectedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched || isLoading || isGameLost)
      return;

    playFlipSound(); // Jouer le son de retournement de carte

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
    setMovesLeft((prev) => prev - 1);
    setMovesMade(movesMade + 1);

    if (newCards.every((card) => card.isMatched)) {
      if (dailyGames < 2) {
        updateUserBoosters(1);
        updateDailyStats(1, 1);
      }
      setIsGameWon(true);
      playWinSound();
    } else if (movesLeft <= 1) {
      setIsGameLost(true);
      updateDailyStats(0, 1);
      playLoseSound();
    }
  };

  const updateUserBoosters = async (boosters: number) => {
    if (!user) return;
    const userDocRef = doc(db, "collections", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      const currentBoosters = data.nbBooster || 0;
      await updateDoc(userDocRef, { nbBooster: currentBoosters + boosters });
    }
  };

  const updateDailyStats = async (boosters: number, games: number) => {
    if (!user) return;
    const userDocRef = doc(db, "collections", user.uid);
    await updateDoc(userDocRef, {
      dailyGames: dailyGames + games,
    });
    setDailyGames((prev) => prev + games);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white pt-16 sm:pt-24 px-2 sm:px-4">
      <title>TCG2i - Memory</title>
      
      <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-blue-400 text-center">
        🃏 Jeu de Memory
      </h1>

      <div className="w-full max-w-lg">
        <div className="flex flex-wrap justify-center items-center gap-1 text-xs sm:text-sm text-gray-300">
          {!isLoading && isGameStarted && !isGameWon && !isGameLost && (
            <div className="rounded-lg bg-gray-800/50 px-2 backdrop-blur-sm">
              Coups : {movesLeft}
            </div>
          )}

          {!isLoading && dailyGames < 2 && (
            <div className="rounded-lg bg-gray-800/50 px-2 backdrop-blur-sm">
              Boosters : {2 - dailyGames}
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      <AnimatePresence>
        {(isGameWon || isGameLost) && (
          <motion.div 
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gray-800 border border-blue-500 rounded-xl p-4 sm:p-6 w-full max-w-[300px] sm:max-w-md mx-auto"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
            >
              {/* ...existing modal content... */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-48 sm:h-64">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-300 text-xs sm:text-sm mt-4">
            Chargement... ({imagesLoaded}/{totalImages})
          </p>
        </div>
      ) : (
        <>
            <div className="memory-grid">
            {cards.map((card, index) => (
              <motion.div
              key={card.uniqueId}
              className="relative w-auto sm:h-40 cursor-pointer rounded-lg "
              onClick={() => isGameStarted && handleCardClick(index)}
              initial={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              >
              <img
                src={card.isFlipped || card.isMatched ? card.imageURL : "/ressources/card-back.png"}
                alt="Card"
                className="w-full h-full rounded-lg border border-gray-700"
                loading="lazy"
              />
              </motion.div>
            ))}
            </div>

          <div className=""></div>
            {!isGameStarted && !isGameWon && !isGameLost && (
              <motion.button
                onClick={() => { setIsGameStarted(true); updateLastPlayedGameDate(); }}
                className="px-4 sm:px-6 py-1 text-sm sm:text-base bg-blue-600 hover:bg-blue-700 
                  text-white font-semibold rounded-lg transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Jouer
              </motion.button>
            )}
        </>
      )}
    </div>
  );
}