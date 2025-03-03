"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden relative">
      {/* 🔘 Bouton burger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-300 hover:text-white transition relative z-50"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* 📜 Menu mobile (apparition fluide) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 🔲 Overlay semi-transparent */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* 📌 Contenu du menu */}
            <motion.nav
              className="absolute top-12 right-0 w-48 bg-gray-900 shadow-lg rounded-lg overflow-hidden z-50"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col p-4 gap-3">
                {["Boosters", "Collection", "Memory", "Classement"].map((item, index) => (
                  <Link
                    key={index}
                    href={item === "Boosters" ? "/" : `/${item.toLowerCase()}`}
                    className="text-white text-lg font-semibold hover:text-blue-400 transition px-3 py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
