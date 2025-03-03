"use client";

import { motion } from "framer-motion";

export type CardProps = {
  id: string;
  name: string;
  rarity: string;
  imageURL: string;
  isRevealed?: boolean;
  isOwned?: boolean;
  isNew?: boolean; // Ajoutez cette propriété pour indiquer si la carte est nouvelle
};

export default function Card({ id, name, rarity, imageURL, isRevealed = true, isOwned = true, isNew }: CardProps) {
  console.log(id);
  console.log(rarity);
  return (
    <motion.div
      className={`relative w-full h-auto aspect-[2/3] rounded-lg 
        shadow-lg transition-all duration-300 ease-out 
        ${isOwned ? "" : "grayscale"}`}
      whileHover={{ scale: isRevealed ? 1.02 : 1 }}
      whileTap={{ scale: isRevealed ? 0.98 : 1 }}
    >
      <img 
        src={imageURL} 
        alt={name}
        className="w-full h-full object-contain rounded-lg"
        loading="lazy"
      />
      {isNew && (
        <div className="absolute top-2 right-2 
          bg-gradient-to-r from-red-500 to-pink-500 
          text-white text-xs font-bold px-2 py-0.5 
          rounded-full shadow-lg animate-pulse">
          NEW
        </div>
      )}
    </motion.div>
  );
}
