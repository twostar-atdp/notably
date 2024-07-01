// app/(navbar)/navbar.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from 'next/navigation';
import WidthWrapper from "../(wrapper)/widthWrapper";
import { useSpotifyOauth } from "../(authPages)/oauth/client";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout, isAuthenticated } = useSpotifyOauth();
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const showMenu = isClient && isAuthenticated && pathname !== '/login';

  return (
    <nav className="sticky top-0 z-[60] flex h-[80px] w-full flex-col items-center justify-center bg-palette-background md:h-[130px]">
      <WidthWrapper>
        <div className="flex h-full w-full flex-row items-center justify-between">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => showMenu && setIsMenuOpen(!isMenuOpen)}
              className={`px-8 py-3 border-2 border-palette-text bg-palette-tertiary text-2xl font-bold text-palette-text ${
                showMenu ? 'shadow-button transition-all duration-300 ease-out hover:shadow-buttonHover' : ''
              }`}
            >
              Notably.
            </button>
            {showMenu && isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 rounded-md shadow-lg bg-palette-background border-2 border-palette-text">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-palette-text hover:bg-palette-tertiary transition-colors duration-200"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </WidthWrapper>
    </nav>
  );
}