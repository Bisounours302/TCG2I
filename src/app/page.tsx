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

  const boosterFrontURL = "/ressources/booster_avant.png";
  const boosterBackURL = "/ressources/booster_arriere.png";

  useEffect(() => {
    if (user) {
      fetchUserBoosters();
    }
  }, [user]);

  const fetchUserBoosters = async () => {
    if (!user) return;
    const userDocRef = doc(db, "collections", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      setBoosters(data.nbBooster || 0);
    }
  };

  const openPack = async () => {
    if (!user) return alert("Veuillez vous connecter pour ouvrir un pack.");
    if (boosters <= 0) return alert("Vous n'avez plus de boosters disponibles.");

    setIsFront(true);
    setIsOpening(true);

    try {
      const res = await fetch("/api/open-pack");
      if (!res.ok) throw new Error("Erreur réseau lors de la récupération du pack");

      const data = await res.json();
      if (data.pack && Array.isArray(data.pack)) {
        setTimeout(() => {
          setFlash(true);
          setTimeout(() => {
            setCards(data.pack);
            setIsOpening(false);
            setShowBooster(false);
            setFlash(false);
          }, 300);
        }, 2000);

        await saveCardsToCollection(data.pack);
        await updateUserBoosters();
      }
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

  const updateUserBoosters = async () => {
    if (!user) return;
    const userDocRef = doc(db, "collections", user.uid);
    await updateDoc(userDocRef, { nbBooster: boosters - 1 });
    setBoosters(boosters - 1);
  };

  const revealNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setAllCardsRevealed(true);
    }
  };

  const resetBooster = () => {
    setShowBooster(true);
    setCards([]);
    setCurrentCardIndex(0);
    setAllCardsRevealed(false);
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
            className="flex flex-col items-center"
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
                    duration: 2,
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
    </div>
  );
}
