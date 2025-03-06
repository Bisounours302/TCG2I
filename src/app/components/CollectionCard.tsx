"use client";

import { useEffect, useRef } from "react";
import { CardProps } from "./Card";
import { motion } from "framer-motion";

export default function CollectionCard({ id, name, imageURL, quantity, isOwned = true }: CardProps & { quantity: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current || !isOwned) return;

    const card = cardRef.current;
    let rafId: number;
    let bounds: DOMRect;

    const rotateToMouse = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        bounds = card.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const leftX = mouseX - bounds.x;
        const topY = mouseY - bounds.y;
        const center = {
          x: leftX - bounds.width / 2,
          y: topY - bounds.height / 2
        };
        const distance = Math.sqrt(center.x ** 2 + center.y ** 2);

        card.style.transition = 'none';
        card.style.transform = `
          ${id}zzz
          perspective(1000px)
          rotate3d(
            ${center.y / 150},
            ${-center.x / 150},
            0,
            ${Math.min(Math.log(distance) * 2, 10)}deg
          )
        `;
      });
    };

    const resetRotation = () => {
      if (rafId) cancelAnimationFrame(rafId);

      card.style.transition = 'transform 0.2s ease-out';
      card.style.transform = 'perspective(1000px) rotate3d(0, 0, 0, 0deg)';
    };

    card.addEventListener('mousemove', rotateToMouse);
    card.addEventListener('mouseleave', resetRotation);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      card.removeEventListener('mousemove', rotateToMouse);
      card.removeEventListener('mouseleave', resetRotation);
    };
  }, [isOwned, id]);

  return (
    <motion.div
      className="group relative w-full aspect-[2/3] transition-all duration-300"
      whileHover={{ scale: isOwned ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div
        ref={cardRef}
        className={`relative w-full h-full will-change-transform rounded-lg
          ${!isOwned ? 'grayscale' : ''}`}
        style={{ perspective: "1000px" }}
      >
        <img
          src={imageURL}
          alt={name}
          className="w-full h-full  rounded-lg"
          loading="lazy"
        />

        {quantity > 0 && (
          <div className="absolute bottom-2 right-2 
            bg-gradient-to-r from-blue-500 to-purple-500
            text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 
            rounded-full z-10 shadow-lg
            transform transition-all duration-200
            group-hover:scale-110 group-hover:shadow-xl">
            {quantity}
          </div>
        )}
      </div>
    </motion.div>
  );
}
