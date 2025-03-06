"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { motion } from "framer-motion";
import RestrictedAccess from "@/src/components/RestrictedAccess";

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
    <RestrictedAccess>
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-24 md:py-32">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-12 text-center">
          🏆 Classement des Collectionneurs
        </h1>

        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
          </div>
        ) : (
          <div className="w-full max-w-4xl space-y-4">
            {players.map((player, index) => (
              <motion.div
                key={player.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-6 rounded-xl backdrop-blur-sm border transition-all hover:translate-y-[-2px]
                  ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/50' : 
                    index === 1 ? 'bg-gray-400/10 border-gray-400/50' :
                    index === 2 ? 'bg-amber-700/10 border-amber-700/50' :
                    'bg-gray-800/30 border-gray-700/30'}`}
              >
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
                    <span className={`text-3xl font-bold
                      ${index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-amber-700' :
                        'text-gray-600'}`}>
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="flex-grow">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {player.name}
                    </h2>
                    <div className="flex gap-6 text-base">
                      <span className="text-gray-300">
                        {player.uniqueCards} cartes uniques
                      </span>
                    </div>
                  </div>

                  {index < 3 && (
                    <div className="flex-shrink-0 text-4xl">
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </RestrictedAccess>
  );
}
