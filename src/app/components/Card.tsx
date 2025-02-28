"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export type CardProps = {
  id: string;
  name: string;
  rarity: string;
  imageURL: string;
  quantity?: number;
  isRevealed?: boolean;
  isOwned?: boolean;
};

export default function Card({ 
  name, 
  imageURL, 
  isRevealed = true, 
  isOwned = true
}: CardProps) {
  return (
    <motion.div
      className={`relative w-full h-auto aspect-[2/3] overflow-hidden rounded-lg transition-all duration-200 ease-in-out ${isOwned ? "" : "grayscale"}`}
      whileHover={{ scale: isRevealed ? 1.05 : 1 }}
      whileTap={{ scale: isRevealed ? 0.95 : 1 }}
    >
      <Image 
        src={imageURL} 
        alt={name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        priority={false}
        className={`object-contain ${!isRevealed ? "blur-sm" : ""}`}
        unoptimized={true} 
      />
    </motion.div>
  );
}