"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/src/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import Card from "@/src/app/components/Card";

export default function BoostersPage() {
  const [cards, setCards] = useState<
    { id: string; name: string; rarity: string; imageURL: string }[]
  >([]);
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
    const secretCards = await fetchCardsByRarity("secrete");
  
    const random = Math.random();
    let booster = [];
  
    if (random < 0.7) {
      // Booster commun
      booster = getRandomCards(commonCards, 6);
    } else if (random < 0.9) {
      // Booster rare
      booster = [...getRandomCards(commonCards, 5), getRandomCard(rareCards)];
    } else {
      // Booster secret
      booster = [
        ...getRandomCards(commonCards, 4),
        getRandomCard(rareCards),
        getRandomCard(secretCards),
      ];
    }
  
    return booster;
  };
  
  const fetchCardsByRarity = async (rarity: string) => {
    try {
      const res = await fetch(`/api/rarity-booster?rarity=${rarity}`);
      if (!res.ok) {
        console.error(`Erreur chargement cartes: ${res.status} ${res.statusText}`);
        throw new Error("Erreur chargement cartes");
      }
      const data = await res.json();
      return data.cards;
    } catch (error) {
      console.error("Erreur lors de la récupération des cartes :", error);
      throw error;
    }
  };
  
  const getRandomCards = (cards: any[], count: number) => {
    const shuffled = cards.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  
  const getRandomCard = (cards: any[]) => {
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
    }

  };

  const saveCardsToCollection = async (pack: { id: string }[]) => {
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
              <h1 className="text-4xl md:text-6xl font-bold text-blue-400 drop-shadow-lg text-center mb-8 md:mb-12">
                🎁 Ouverture de Booster ({boosters} restants)
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
                  <Image
                    src={isFront ? boosterFrontURL : boosterBackURL}
                    alt="Booster"
                    fill
                    className="object-contain"
                  />
                </motion.div>
              ) : (
                <Image
                  src={boosterFrontURL}
                  alt="Booster face"
                  width={350}
                  height={500}
                  className="w-[250px] md:w-[350px] h-auto"
                />
              )}
            </motion.div>
          </motion.div>
        ) : !allCardsRevealed ? (
          <motion.div
            key="single-card"
            className="flex flex-col items-center justify-center h-screen relative"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onClick={revealNextCard}
          >
            <Card {...cards[currentCardIndex]} isRevealed={true} />
            <p className="mt-4 text-lg text-gray-300">Cliquez pour voir la carte suivante</p>
          </motion.div>
        ) : (
          <motion.div
            key="cards-grid"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-5xl px-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-20">
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
              className="mt-8 mx-auto flex justify-center px-8 py-3 bg-blue-500 text-white rounded-xl shadow-lg transition-all"
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
          className="fixed bottom-8 right-8 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-all"
        >
          Collecter 🎁
        </motion.button>
      ) : (
        <p className="fixed bottom-8 right-8 px-6 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-lg transition-all">
          Booster gratuit collecté ! Prochain booster à {nextBoosterTime}
        </p>
      )}
      </div>
    </div>
  );
}
