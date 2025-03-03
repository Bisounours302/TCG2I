"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@/src/app/components/Card";

interface CardData {
  id: string;
  name: string;
  rarity: string;
  imageURL: string;
}

export default function BoostersPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [showBooster, setShowBooster] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [allCardsRevealed, setAllCardsRevealed] = useState(false);
  const { user } = useAuth();
  const [flash, setFlash] = useState(false);
  const [isFront, setIsFront] = useState(true);
  const [boosters, setBoosters] = useState(0);
  const [lastBoosterCollectedDate, setLastBoosterCollectedDate] = useState<Date | null>(null);
  const [canCollectBooster, setCanCollectBooster] = useState(false);
  const [nextBoosterTime, setNextBoosterTime] = useState("");

  const boosterFrontURL = "/ressources/booster_avant.png";
  const boosterBackURL = "/ressources/booster_arriere.png";

  const playFlipSound = () => {
    const audio = new Audio("../ressources/flipcard.mp3");
    audio.volume = 0.5;
    audio.play();
  };

  const playCardDealSound = () => {
    const audio = new Audio("../ressources/carddeal.mp3");
    audio.volume = 0.1;
    audio.play();
  };

  useEffect(() => {
    if (user) {
      fetchUserBoosters();
    }
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastBoosterCollectedDate) {
        checkBoosterAvailability(lastBoosterCollectedDate);
      }
    }, 1000); // Vérifie toutes les 1 secondes

    return () => clearInterval(interval);
  }, [lastBoosterCollectedDate]);

  const fetchUserBoosters = async () => {
    if (!user) return;
    const userDocRef = doc(db, "collections", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      setBoosters(data.nbBooster || 0);
      setLastBoosterCollectedDate(data.LastBoosterCollectedDate?.toDate() || null);
      checkBoosterAvailability(data.LastBoosterCollectedDate?.toDate() || null);
    }
  };

  const checkBoosterAvailability = (lastCollected: Date | null) => {
    const now = new Date();
  
    // Créneaux fixes
    const boosterTimes = [
      { hour: 4, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 20, minute: 0 }
    ];
  
    let nextBooster: Date | null = null;
    let lastBoosterTime: Date | null = null;
  
    for (const { hour, minute } of boosterTimes) {
      const boosterTime = new Date();
      boosterTime.setHours(hour, minute, 0, 0);
  
      if (boosterTime > now) {
        if (!nextBooster) nextBooster = boosterTime;
        break;
      }
      lastBoosterTime = boosterTime; // Dernier créneau passé
    }
  
    // Si aucune heure future trouvée, prendre le premier créneau du lendemain
    if (!nextBooster) {
      nextBooster = new Date();
      nextBooster.setDate(nextBooster.getDate() + 1);
      nextBooster.setHours(boosterTimes[0].hour, boosterTimes[0].minute, 0, 0);
    }
  
    // Mettre à jour l'affichage de l'heure du prochain booster
    setNextBoosterTime(nextBooster.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  
    console.log("Last collected:", lastCollected);
    console.log("Actual time:", now);
    console.log("Next booster time:", nextBooster);
    console.log("Last booster time:", lastBoosterTime);
  
    // Correction de la condition de récupération du booster
    if (!lastCollected || (lastBoosterTime && lastCollected < lastBoosterTime)) {
      setCanCollectBooster(true);
      console.log("Booster can be collected");
    } else {
      setCanCollectBooster(false);
      console.log("Booster cannot be collected yet");
    }
  };

  const generateBooster = async () => {
    const commonCards = await fetchCardsByRarity("commune");
    const rareCards = await fetchCardsByRarity("brillante");
    const superRareCards = await fetchCardsByRarity("super-rare");
    const secretCards = await fetchCardsByRarity("secrete");
  
    const random = Math.random();
    let booster: CardData[] = [];
  
    if (random < 0.6) {
      // 60% - 5 communes + 1 brillante
      booster = [...getRandomCards(commonCards, 5), getRandomCard(rareCards)];
    } else if (random < 0.9) {
      // 30% - 4 communes + 2 brillantes
      booster = [...getRandomCards(commonCards, 4), ...getRandomCards(rareCards, 2)];
    } else if (random < 0.98) {
      // 8% - 5 communes + 1 super-rare
      booster = [...getRandomCards(commonCards, 5), getRandomCard(superRareCards)];
    } else if (random < 0.99) {
      // 1% - 6 brillantes
      booster = getRandomCards(rareCards, 6);
    } else {
      // 1% - 5 communes + 1 secrete
      booster = [...getRandomCards(commonCards, 5), getRandomCard(secretCards)];
    }
  
    return booster;
  };
  
  const fetchCardsByRarity = async (rarity: string): Promise<CardData[]> => {
    try {
      const res = await fetch(`/api/rarity-booster?rarity=${rarity}`);
      if (!res.ok) {
        console.error(`Erreur chargement cartes: ${res.status} ${res.statusText}`);
        throw new Error("Erreur chargement cartes");
      }
      const data = await res.json();
      console.log(`Cartes récupérées pour la rareté ${rarity}:`, data.cards);
      return data.cards;
    } catch (error) {
      console.error("Erreur lors de la récupération des cartes :", error);
      throw error;
    }
  };
  
  const getRandomCards = (cards: CardData[], count: number): CardData[] => {
    const shuffled = cards.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  
  const getRandomCard = (cards: CardData[]): CardData => {
    const index = Math.floor(Math.random() * cards.length);
    return cards[index];
  };

  const openPack = async () => {
    if (!user) return alert("Veuillez vous connecter pour ouvrir un pack.");
    if (boosters <= 0) return alert("Vous n'avez plus de boosters disponibles.");
  
    setIsFront(true);
    setIsOpening(true);
    (document.getElementsByClassName("MessageBooster")[0] as HTMLElement).style.display = "none";


    try {
      const booster = await generateBooster();
      if (!booster.length) {
        throw new Error("Aucune carte récupérée pour le booster");
      }
      setTimeout(() => {
        setFlash(true);
        setTimeout(() => {
          setCards(booster);
          setIsOpening(false);
          setShowBooster(false);
          setFlash(false);
        }, 300);
      }, 1000);
  
      await saveCardsToCollection(booster);
      await updateUserBoosters(-1);
      playFlipSound();
    } catch (error) {
      console.error("Erreur ouverture du pack :", error);
      alert("Erreur lors de l'ouverture du pack. Veuillez réessayer.");
      setIsOpening(false);
    }

  };

  const saveCardsToCollection = async (pack: CardData[]) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "collections", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userCards = userDoc.exists() ? userDoc.data().cards || {} : {};

      pack.forEach((card) => {
        if (card.id) userCards[card.id] = (userCards[card.id] || 0) + 1;
      });

      await updateDoc(userDocRef, { cards: userCards });
    } catch (error) {
      console.error("Erreur ajout collection :", error);
    }
  };

  const updateUserBoosters = async (change: number) => {
    if (!user) return;
    const userDocRef = doc(db, "collections", user.uid);
    await updateDoc(userDocRef, { nbBooster: boosters + change });
    setBoosters(boosters + change);
  };

  const revealNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      playFlipSound();
    } else {
      setAllCardsRevealed(true);
      playCardDealSound();
    }
  };

  const resetBooster = () => {
    setShowBooster(true);
    setCards([]);
    setCurrentCardIndex(0);
    setAllCardsRevealed(false);
    (document.getElementsByClassName("MessageBooster")[0] as HTMLElement).style.display = "block";
  };

  const collectBooster = async () => {
    if (!user) return alert("Veuillez vous connecter pour collecter un booster.");
    if (!canCollectBooster) return;
  
    // Désactiver immédiatement le bouton pour éviter les doubles clics
    setCanCollectBooster(false);
  
    try {
      const now = new Date();
      const userDocRef = doc(db, "collections", user.uid);
      
      // Mise à jour Firestore
      await updateDoc(userDocRef, { LastBoosterCollectedDate: now });
  
      // Mettre à jour l'état local
      setLastBoosterCollectedDate(now);
      await updateUserBoosters(1); // Ajoute +1 booster
  
      // Ajout d’un délai pour que l'UI se mette bien à jour avant la prochaine vérification
      setTimeout(() => {
        checkBoosterAvailability(now);
      }, 500);
      
      console.log("Booster collecté !");
    } catch (error) {
      console.error("Erreur lors de la collecte :", error);
      
      // En cas d'erreur, on réactive le bouton pour que l'utilisateur puisse réessayer
      setCanCollectBooster(true);
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-0 relative overflow-hidden">
      <title>TCG2i - Boosters</title>
      {flash && (
        <motion.div
          className="absolute inset-0 bg-white/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.4 }}
        />
      )}

      <AnimatePresence mode="wait">
        {showBooster ? (
          <motion.div
            key="booster"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center mt-8 md:mt-16"
          >
            {!isOpening && (
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-blue-400 drop-shadow-lg text-center mb-6 md:mb-12 px-4">
                Ouverture de Booster
              </h1>
            )}

            <motion.div
              onClick={openPack}
              className="cursor-pointer relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
                {isOpening ? (
                <motion.div
                  animate={{ rotateY: [0, 180, 360, 540, 720] }}
                  transition={{
                  duration: 1.5,
                  ease: "linear",
                  repeat: Infinity,
                  onUpdate: (latest: number) => {
                    if (latest % 360 >= 90 && latest % 360 < 270) {
                    setIsFront(false);
                    } else {
                    setIsFront(true);
                    }
                  },
                  }}
                  className="w-[250px] md:w-[350px] aspect-[7/10] relative"
                >
                  <img
                  src={isFront ? boosterFrontURL : boosterBackURL}
                  alt="Booster"
                  className="object-contain w-full h-full"
                  />
                </motion.div>
                ) : (
                <img
                  src={boosterFrontURL}
                  alt="Booster face"
                  className="w-[250px] md:w-[350px] h-auto"
                />
                )}
            </motion.div>
          </motion.div>
        ) : !allCardsRevealed ? (
          <motion.div
            key="single-card"
            className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 w-full"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onClick={revealNextCard}
          >
            <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] mx-auto">
              <Card {...cards[currentCardIndex]} isRevealed={true} />
            </div>
            <p className="mt-4 text-base sm:text-lg text-gray-300 text-center px-4">
              Cliquez pour voir la carte suivante
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="cards-grid"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-5xl px-4 pt-20"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  className="relative aspect-[2/3] w-full"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                >
                  <Card {...card} isRevealed={true} />
                </motion.div>
              ))}
            </div>
            <motion.button
              onClick={resetBooster}
              className="mt-6 sm:mt-8 mx-auto flex justify-center px-6 sm:px-8 py-2 sm:py-3 
                bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg 
                transition-all text-sm sm:text-base font-semibold"
            >
              Continuer
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="MessageBooster">
      {canCollectBooster ? (
        <motion.button
          onClick={collectBooster}
          className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 
            px-4 sm:px-6 py-2 sm:py-3 
            bg-green-600 hover:bg-green-700 
            text-white text-sm sm:text-base font-bold 
            rounded-lg shadow-lg transition-all"
        >
          Collecter 🎁
        </motion.button>
      ) : (
        <p className="fixed bottom-4 sm:bottom-8 right-4 sm:right-8 
          px-4 sm:px-6 py-2 sm:py-3 
          bg-gray-600 text-white text-sm sm:text-base font-bold 
          rounded-lg shadow-lg">
          Prochain booster à {nextBoosterTime}
        </p>
      )}
      </div>
    </div>
  );
}
