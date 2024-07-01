// app/(navbar)/navbar.tsx

"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PocketBase from "pocketbase";
import WidthWrapper from "../(wrapper)/widthWrapper";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

  useEffect(() => {
    setIsAuthenticated(pb.authStore.isValid);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      pb.authStore.clear();
      setIsAuthenticated(false);
      router.push('/login');
    } else {
      router.push('/login');
    }
    toggleMenu();
  };

  return (
    <nav className="sticky top-0 z-[60] flex h-[80px] w-full flex-col items-center justify-center bg-palette-background md:h-[130px]">
      <WidthWrapper>
        <div className="flex h-full w-full flex-row items-center justify-between">
          <Link href="/" className="relative">
            <h1 className="text-3xl font-bold text-gray-900">Notably.</h1>
          </Link>
          {/* Hamburger menu button */}
          <button
            onClick={toggleMenu}
            className="relative z-50 flex h-[50px] w-[50px] flex-col items-center justify-center"
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${isMenuOpen ? 'rotate-45 translate-y-[10px]' : ''}`}></span>
            <span className={`hamburger-line ${isMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`hamburger-line ${isMenuOpen ? '-rotate-45 -translate-y-[10px]' : ''}`}></span>
          </button>
        </div>
      </WidthWrapper>
      {/* Menu overlay */}
      <div
        className={`fixed inset-0 bg-palette-accent transition-opacity duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <Link
            href="/"
            className="mb-5 border-[3px] border-black bg-palette-tertiary p-[10px]"
            onClick={toggleMenu}
          >
            <p className="text-xl font-medium text-palette-text">
              Home
            </p>
          </Link>
          <button
            onClick={handleAuthAction}
            className="mb-5 border-[3px] border-black bg-palette-tertiary p-[10px]"
          >
            <p className="text-xl font-medium text-palette-text">
              {isAuthenticated ? "Logout" : "Login with Spotify"}
            </p>
          </button>
        </div>
      </div>
    </nav>
  );
}