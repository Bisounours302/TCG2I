"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useAuth } from "@/src/hooks/useAuth";

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
    setMovesMade((prev) => prev + 1);

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


  const victoryMessage = () => {
    if(dailyGames < 2) {
      return `🎉 Félicitations ! Vous avez gagné en ${movesMade} coups et gagné 1 booster !`;
    }
    return `🎉 Félicitations ! Vous avez gagné en ${movesMade} coups !`;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 pt-24">
      <h1 className="text-4xl font-bold text-blue-400 mb-6">🃏 Jeu de Memory</h1>

      {isGameWon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-center text-xl font-semibold text-green-400"
        >
          {victoryMessage()}
        </motion.div>
      )}

      {isGameLost && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-center text-xl font-semibold text-red-400"
        >
          😢 Vous avez perdu. Vous avez fait {movesMade} coups.
        </motion.div>
      )}

      {isLoading ? (
        <p className="text-gray-300">Chargement des cartes... ({imagesLoaded}/{totalImages})</p>
      ) : (
        <>
          {!isLoading && isGameStarted && !isGameWon && !isGameLost && (
            <p className="mt-4 text-lg text-gray-300">Coups restants : {movesLeft}</p>
          )}


          {!isLoading && dailyGames < 2  && (
            <p className="mt-2 text-lg text-gray-300">
              Parties restantes pour gagner des boosters : {2 - dailyGames}
            </p>
          )}

          {!isLoading && dailyGames >= 2 && (
            <p className="mt-2 text-lg text-gray-300">
              Plus de boosters à gagner aujour&apos;hui
            </p>
          )}

          
          <div className="grid grid-cols-4 gap-4 mt-4">
            {cards.map((card, index) => (
              <motion.div
                key={card.uniqueId}
                className="relative w-24 h-32 md:w-32 md:h-44 cursor-pointer"
                onClick={() => isGameStarted && handleCardClick(index)}
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

          {!isLoading && !isGameStarted && (
            <motion.button
              onClick={() => { setIsGameStarted(true); updateLastPlayedGameDate(); }}
              className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Jouer
            </motion.button>
          )}
        </>
      )}

      {(isGameWon || isGameLost) && (
        <motion.button
          onClick={fetchCards}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Rejouer
        </motion.button>
      )}
    </div>
  );
}