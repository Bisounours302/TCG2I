"use client";

import Image from "next/image";
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


// Using id and rarity in a console log for demonstration purposes
export default function Card({ id, name, rarity, imageURL, isRevealed = true, isOwned = true, isNew }: CardProps) {
  console.log(`Card ID: ${id}, Rarity: ${rarity}`);
  return (
    <motion.div
      className={"relative w-full h-auto aspect-[2/3] overflow-hidden rounded-lg shadow-md transition-transform duration-200 ease-in-out " + (isOwned ? "" : " grayscale")}
      whileHover={{ scale: isRevealed ? 1.05 : 1 }}
      whileTap={{ scale: isRevealed ? 0.95 : 1 }}
    >
      <Image 
        src={imageURL} 
        alt={name}
        layout="fill" 
        objectFit="contain"
        className='rounded-lg'
        unoptimized={true} 
      />
      {isNew && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          NEW
        </div>
      )}
    </motion.div>
  );
}
