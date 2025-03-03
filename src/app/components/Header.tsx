"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthButton from "./AuthButton";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(true);

  const logoURL = "/ressources/LOGO.png";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setShowDesktopMenu(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full h-16 sm:h-20 px-3 sm:px-6 lg:px-10 
      bg-gray-900/90 backdrop-blur-md shadow-lg 
      flex items-center justify-between z-50 transition-all">
      <Link href="/" className="flex-shrink-0 w-32 sm:w-40">
        {isMounted && (
          <img
            src={logoURL}
            alt="Logo"
            className="h-8 sm:h-10 w-auto drop-shadow-lg transition-transform duration-200 hover:scale-105"
          />
        )}
      </Link>

      {showDesktopMenu && (
        <nav className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-4 xl:gap-6">
          {["Boosters", "Collection", "Memory"].map((item, index) => (
            <Link
              key={index}
              href={item === "Boosters" ? "/" : `/${item.toLowerCase()}`}
              className="text-white text-base xl:text-lg font-semibold tracking-wide 
                relative before:absolute before:bottom-0 before:left-0 before:w-0 
                before:h-[2px] before:bg-blue-400 before:transition-all 
                before:duration-300 hover:before:w-full"
            >
              {item}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex items-center gap-2 sm:gap-4">
        <AuthButton />
        <MobileMenu />
      </div>
    </header>
  );
}
