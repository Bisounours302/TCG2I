"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function BoosterAnimation({ onClick }: { onClick: () => void }) {
  const boosterFrontURL = "/ressources/booster_avant.png";
  const boosterBackURL = "/ressources/booster_arriere.png";

  const [isFront, setIsFront] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isAnimating) return; // Empêcher le spam du clic

    setIsAnimating(true);
    
    setTimeout(() => {
      setIsFront((prev) => !prev); // Alterner l'image après 250ms (mi-parcours de la rotation)
    }, 250);

    setTimeout(() => {
      setIsAnimating(false);
      onClick(); // Ouvre le booster après l'animation
    }, 500);
  };

  return (
    <motion.div
      className="cursor-pointer relative"
      animate={{ rotateY: isFront ? 0 : 180 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      onClick={handleClick}
    >
      <Image
        src={isFront ? boosterFrontURL : boosterBackURL}
        alt="Booster"
        width={350}
        height={500}
        className="w-[250px] md:w-[350px] h-auto"
      />
    </motion.div>
  );
}
