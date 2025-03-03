"use client";

import { useEffect, useRef } from "react";
import { CardProps } from "./Card";
import { motion } from "framer-motion";

export default function CollectionCard({ id, name, imageURL, quantity, isOwned = true }: CardProps & { quantity: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  console.log(id);

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
  }, [isOwned]);

  return (
    <motion.div
      className="card-container group"
      whileHover={{ scale: isOwned ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div
        ref={cardRef}
        className={`relative w-full h-full will-change-transform
          ${!isOwned ? 'grayscale' : ''}`}
        style={{ perspective: "1000px" }}
      >
        <img
          src={imageURL}
          alt={name}
          className="rounded-xl w-full h-full object-cover"
        />

        {quantity > 0 && (
          <div className="absolute bottom-2 right-2 
        bg-gradient-to-r from-blue-500 to-purple-500
        text-white text-sm font-bold px-3 py-1 
        rounded-full z-10
        transform transition-transform duration-200
        group-hover:scale-110">
            {quantity}
          </div>
        )}
      </div>
    </motion.div>
  );
}
