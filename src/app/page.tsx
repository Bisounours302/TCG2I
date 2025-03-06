"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@/src/app/components/Card";
import RestrictedAccess from "@/src/components/RestrictedAccess";

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
  const [boosters, setBoosters] = useState(0);
  const [lastBoosterCollectedDate, setLastBoosterCollectedDate] = useState<Date | null>(null);
  const [canCollectBooster, setCanCollectBooster] = useState(false);
  const [nextBoosterTime, setNextBoosterTime] = useState("");
  const [userCards, setUserCards] = useState<{ [key: string]: number }>({});

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
    const loadUserCards = async () => {
      if (!user) return;
      const userDocRef = doc(db, "collections", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserCards(userDoc.data().cards || {});
      }
    };

    if (user) {
      loadUserCards();
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
  
    // Correction de la condition de récupération du booster
    if (!lastCollected || (lastBoosterTime && lastCollected < lastBoosterTime)) {
      setCanCollectBooster(true);
    } else {
      setCanCollectBooster(false);
    }
  };

  const fetchCardsByRarity = async (rarity: string): Promise<CardData[]> => {
    try {
      const res = await fetch(`/api/rarity-booster?rarity=${rarity}`);
      if (!res.ok) throw new Error("Erreur chargement cartes");
      const data = await res.json();
      return data.cards || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des cartes:", error);
      return [];
    }
  };

  const getRandomCards = (cards: CardData[], count: number): CardData[] => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const generateBooster = async () => {
    try {
      const commonCards = await fetchCardsByRarity("commune");
      const rareCards = await fetchCardsByRarity("brillante");
      const superRareCards = await fetchCardsByRarity("super-rare");
      const secretCards = await fetchCardsByRarity("secrete");

      const random = Math.random();
      let boosterCards = [];

      if (random < 0.6) {
        // 60% - 5 communes + 1 brillante
        boosterCards = [...getRandomCards(commonCards, 5), ...getRandomCards(rareCards, 1)];
      } else if (random < 0.85) {
        // 25% - 4 communes + 2 brillantes
        boosterCards = [...getRandomCards(commonCards, 4), ...getRandomCards(rareCards, 2)];
      } else if (random < 0.9) {
        // 5% - 6 brillantes
        boosterCards = getRandomCards(rareCards, 6);
      } else if (random < 0.94) {
        // 4% - 5 communes + 1 super-rare
        boosterCards = [...getRandomCards(commonCards, 5), ...getRandomCards(superRareCards, 1)];
      } else if (random < 0.965) {
        // 2.5% - 4 communes + 1 brillante + 1 super-rare
        boosterCards = [
          ...getRandomCards(commonCards, 4),
          ...getRandomCards(rareCards, 1),
          ...getRandomCards(superRareCards, 1)
        ];
      } else if (random < 0.98) {
        // 1.5% - 5 brillantes + 1 super-rare
        boosterCards = [...getRandomCards(rareCards, 5), ...getRandomCards(superRareCards, 1)];
      } else if (random < 0.99) {
        // 1% - 4 brillantes + 2 super-rares
        boosterCards = [...getRandomCards(rareCards, 4), ...getRandomCards(superRareCards, 2)];
      } else if (random < 0.995) {
        // 0.5% - 5 communes + 1 secrète
        boosterCards = [...getRandomCards(commonCards, 5), ...getRandomCards(secretCards, 1)];
      } else if (random < 0.998) {
        // 0.3% - 5 brillantes + 1 secrète
        boosterCards = [...getRandomCards(rareCards, 5), ...getRandomCards(secretCards, 1)];
      } else {
        // 0.2% - 4 brillantes + 1 super-rare + 1 secrète
        boosterCards = [
          ...getRandomCards(rareCards, 4),
          ...getRandomCards(superRareCards, 1),
          ...getRandomCards(secretCards, 1)
        ];
      }

      return boosterCards;
    } catch (error) {
      console.error("Error generating booster:", error);
      throw error;
    }
  };

  const openPack = async () => {
    if (!user || isOpening || boosters <= 0) return;

    setIsOpening(true);
    playFlipSound();

    try {
      const boosterCards = await generateBooster();
      
      if (!boosterCards || boosterCards.length === 0) {
        throw new Error("No cards generated");
      }

      const updatedUserCards = { ...userCards };
      boosterCards.forEach((card: CardData) => {
        updatedUserCards[card.id] = (updatedUserCards[card.id] || 0) + 1;
      });

      // Mettre à jour la base de données
      const userRef = doc(db, "collections", user.uid);
      await updateDoc(userRef, {
        cards: updatedUserCards,
        nbBooster: boosters - 1
      });

      // Animation du booster
      setTimeout(() => {
        setShowBooster(false);
        setCards(boosterCards);
        setBoosters(prev => prev - 1);
        setUserCards(updatedUserCards);
        setCurrentCardIndex(0);
        setIsOpening(false);
      }, 1500); // Temps pour l'animation du booster

    } catch (error) {
      console.error("Erreur ouverture du pack:", error);
      alert("Erreur lors de l'ouverture du booster. Veuillez réessayer.");
      setShowBooster(true);
      setIsOpening(false);
    }
  };

  const updateUserBoosters = async (change: number) => {
    if (!user) return;
    const userDocRef = doc(db, "collections", user.uid);
    await updateDoc(userDocRef, { nbBooster: boosters + change });
    setBoosters(boosters + change);
  };

  const revealNextCard = () => {
    playFlipSound();
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      playCardDealSound();
      setAllCardsRevealed(true);
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
      
    } catch (error) {
      console.error("Erreur lors de la collecte :", error);
      
      // En cas d'erreur, on réactive le bouton pour que l'utilisateur puisse réessayer
      setCanCollectBooster(true);
    }
  };
  

  return (
    <RestrictedAccess>
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <title>TCG2i - Boosters</title>
        
        <AnimatePresence mode="wait">
          {showBooster ? (
            <motion.div
              key="booster"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center h-screen"
            >
              {!isOpening && (
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-blue-400 text-center mb-8 md:mb-12">
                  Ouverture de Booster
                </h1>
              )}

              <motion.div
                onClick={openPack}
                className="cursor-pointer relative transform hover:scale-105 transition-transform"
                whileTap={{ scale: 0.95 }}
              >
                {isOpening ? (
                  <motion.div
                    animate={{ rotateY: 360 }}
                    transition={{
                      duration: 0.8, // Réduit de 1.5 à 0.8 pour une rotation plus rapide
                      ease: "linear",
                      repeat: Infinity
                    }}
                    style={{
                      transformStyle: 'preserve-3d'
                    }}
                    className="w-[200px] sm:w-[250px] md:w-[300px] aspect-[7/10] relative"
                  >
                    <img
                      src={boosterFrontURL}
                      alt="Booster front"
                      className="absolute w-full h-full object-contain rounded-lg backface-visibility-hidden" // Retiré shadow-2xl
                      style={{ backfaceVisibility: 'hidden' }}
                    />
                    <img
                      src={boosterBackURL}
                      alt="Booster back"
                      className="absolute w-full h-full object-contain rounded-lg backface-visibility-hidden transform rotate-y-180" // Retiré shadow-2xl
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    />
                  </motion.div>
                ) : (
                  <img
                    src={boosterFrontURL}
                    alt="Booster face"
                    className="w-[200px] sm:w-[250px] md:w-[300px] h-auto rounded-lg" // Retiré shadow-2xl
                  />
                )}
              </motion.div>
            </motion.div>
          ) : !allCardsRevealed ? (
            <motion.div
              key="single-card"
              className="flex flex-col items-center justify-center h-screen w-full max-w-2xl mx-auto px-4"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={revealNextCard}
            >
              <div className="w-[280px] sm:w-[320px] md:w-[400px] mx-auto">
                <Card {...cards[currentCardIndex]} isRevealed={true} />
              </div>
              <p className="mt-6 text-lg md:text-xl text-gray-300 text-center">
                Cliquez pour voir la carte suivante ({currentCardIndex + 1}/6)
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="cards-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="min-h-screen flex flex-col items-center justify-center px-4 py-20  sm:py-0 sm:pt-20" // Ajout de padding-top sur mobile
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 w-full max-w-[800px] mx-auto">
                {cards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    className="w-full aspect-[686/1000]"
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
                className="mt-4 px-8 py-2 text-lg font-semibold bg-blue-600 hover:bg-blue-700 
                  rounded-xl transition-colors"
              >
                Continuer
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modification du MessageBooster pour le cacher pendant l'ouverture */}
        <div className={`MessageBooster fixed bottom-6 right-6 z-50 transition-opacity duration-300
          ${(!showBooster || isOpening) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {canCollectBooster ? (
            <motion.button
              onClick={collectBooster}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 
                text-white text-lg font-bold rounded-xl
                transition-colors flex items-center gap-2"
            >
              Collecter <span className="text-2xl">🎁</span>
            </motion.button>
          ) : (
            <div className="px-6 py-3 bg-gray-800/90 backdrop-blur-sm 
              text-white text-lg font-bold rounded-xl
              border border-gray-700">
              Prochain booster à {nextBoosterTime}
            </div>
          )}
        </div>
      </div>
    </RestrictedAccess>
  );
}
