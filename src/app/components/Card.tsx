"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type CardProps = {
  id: string;
  name: string;
  rarity: string;
  imageURL: string;
  isRevealed?: boolean;
  isOwned?: boolean;
};

export default function Card({ id, name, rarity, imageURL, isRevealed = true , isOwned = true}: CardProps) {
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
    </motion.div>

  );
}
