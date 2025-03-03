"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { motion } from "framer-motion";

interface PlayerData {
  name: string;
  cards: { [key: string]: number };
  uniqueCards: number;
}

export default function ClassementPage() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const collectionsRef = collection(db, "collections");
        const snapshot = await getDocs(collectionsRef);
        
        const playersData = snapshot.docs.map(doc => {
          const data = doc.data();
          const cards = data.cards || {};
          return {
            name: data.nomJoueur || "Joueur Inconnu",
            cards: cards,
            uniqueCards: Object.keys(cards).length
          };
        });

        // Sort by unique cards count, then total cards
        const sortedPlayers = playersData.sort((a, b) => {
            return b.uniqueCards - a.uniqueCards;
          
        });

        setPlayers(sortedPlayers);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching players:", error);
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 pt-24 pb-12 px-4">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
        🏆 Classement des Collectionneurs
      </h1>

      {loading ? (
        <div className="text-white">Chargement...</div>
      ) : (
        <div className="w-full max-w-4xl">
          {players.map((player, index) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`mb-4 p-4 rounded-lg backdrop-blur-sm
                ${index === 0 ? 'bg-yellow-500/10 ring-2 ring-yellow-500' : 
                  index === 1 ? 'bg-gray-400/10 ring-2 ring-gray-400' :
                  index === 2 ? 'bg-amber-700/10 ring-2 ring-amber-700' :
                  'bg-gray-800/50'}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <span className={`text-2xl font-bold
                    ${index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-amber-700' :
                      'text-gray-600'}`}>
                    #{index + 1}
                  </span>
                </div>
                
                <div className="flex-grow">
                  <h2 className="text-xl font-semibold text-white">
                    {player.name}
                  </h2>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>{player.uniqueCards} cartes uniques</span>
                  </div>
                </div>

                {index < 3 && (
                  <div className="flex-shrink-0">
                    {index === 0 && <span className="text-3xl">🥇</span>}
                    {index === 1 && <span className="text-3xl">🥈</span>}
                    {index === 2 && <span className="text-3xl">🥉</span>}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
