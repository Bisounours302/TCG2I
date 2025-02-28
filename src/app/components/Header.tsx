"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebaseConfig";
import AuthButton from "./AuthButton";
import MobileMenu from "./MobileMenu";

export default function Header() {
  const [logoURL, setLogoURL] = useState<string>("/placeholder-logo.png");
  const [isMounted, setIsMounted] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(true);

  // Define navigation items only once
  const navItems = useMemo(() => [
    { name: "Boosters", path: "/" },
    { name: "Collection", path: "/collection" },
    { name: "Mini-jeux", path: "/mini-jeux" }
  ], []);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch logo from Firebase Storage
  useEffect(() => {
    if (!isMounted) return;

    const fetchLogo = async () => {
      try {
        const storage = getStorage(app);
        const logoRef = ref(storage, "ressources/LOGO.png");
        const url = await getDownloadURL(logoRef);
        setLogoURL(url);
      } catch (error) {
        console.error("Error loading logo:", error);
        // Keep using placeholder logo (already set as default state)
      }
    };

    fetchLogo();
  }, [isMounted]);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setShowDesktopMenu(window.innerWidth >= 1024);
    };

    // Only add event listener on client-side
    if (typeof window !== 'undefined') {
      handleResize(); // Initial check
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full h-16 xs:h-20 px-4 md:px-10 bg-gray-900/90 backdrop-blur-md shadow-lg flex items-center justify-between z-50 transition-all">
      {/* Logo */}
      <Link href="/" className="flex-shrink-0 w-40">
        {isMounted && (
          <Image
            src={logoURL}
            alt="Logo"
            width={120}
            height={48}
            className="h-10 xs:h-12 w-auto drop-shadow-lg transition-transform duration-200 hover:scale-105"
            priority
            onError={() => setLogoURL("/placeholder-logo.png")}
          />
        )}
      </Link>

      {/* Desktop Navigation */}
      {showDesktopMenu && (
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className="text-white text-lg font-semibold tracking-wide relative before:absolute before:bottom-0 before:left-0 before:w-0 before:h-[2px] before:bg-blue-400 before:transition-all before:duration-300 hover:before:w-full"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      )}

      {/* Auth Button + Mobile Menu */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <AuthButton />
        <MobileMenu />
      </div>
    </header>
  );
}