'use client';

import { Silkscreen } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { useState } from "react";

const silkscreen = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <html lang="en">
      <head>
        <title>Biome Keeper</title>
        <meta name="description" content="Your adventure in the world of biomes begins here!" />
      </head>
      <body className={`${silkscreen.className} overflow-x-hidden`}>
        <header className="border-b border-b-blue-900 p-4 sm:p-6 flex items-center justify-between bg-blue-900 h-20 relative z-50">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <img
              src="/CyberiaLogo.png"
              alt="Biome Keeper Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
            />
            <h1 className="text-2xl sm:text-3xl text-white">
              <Link href="/" onClick={closeMenu}>Biome Keeper</Link>
            </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex ml-auto">
            <ul className="flex gap-4">
              {['Home', 'About Us', 'Login', 'Profile'].map((item) => (
                <li key={item}>
                  <Link
                    href={item === 'Home' ? '/' : `/${item.replace(/\s+/g, '').toLowerCase()}`}
                    className="text-white hover:text-blue-300 transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hamburger Icon */}
          <button
            onClick={toggleMenu}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 relative z-50"
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? 'rotate-45 translate-y-2' : ''
              }`}
            ></span>
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 my-1.5 ${
                isMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            ></span>
            <span
              className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? '-rotate-45 -translate-y-2' : ''
              }`}
            ></span>
          </button>

          {/* Mobile Menu Overlay */}
          <div
            className={`fixed inset-0 bg-blue-900 bg-opacity-95 transition-all duration-300 ease-in-out md:hidden
            ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          >
            <nav className="flex flex-col items-center justify-center h-full gap-8 text-2xl text-white">
              {['Home', 'About Us', 'Login', 'Profile'].map((item) => (
                <Link
                  key={item}
                  href={item === 'Home' ? '/' : `/${item.replace(/\s+/g, '').toLowerCase()}`}
                  onClick={closeMenu}
                  className="hover:text-blue-300 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* Page content */}
        {children}
      </body>
    </html>
  );
}
