"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black text-white">
      {/* Background Image */}
      <div className="absolute inset-0 -z-20">
        <Image
          src="/Cyberia.png"
          alt="Cyberia Background"
          fill
          className="object-cover object-center brightness-[0.4]"
          priority
          quality={100}
        />
      </div>

      {/* Blur Overlay */}
      <div className="absolute inset-0 -z-10 backdrop-blur-[6px] bg-gradient-to-b from-blue-900/40 via-indigo-900/50 to-black/80"></div>

      {/* Floating Ambient Light Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] bg-cyan-500/25 blur-[120px] rounded-full"
          animate={{
            x: [0, 50, -50, 0],
            y: [0, 40, -40, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-0 bottom-0 w-[400px] h-[400px] bg-blue-700/25 blur-[120px] rounded-full"
          animate={{
            x: [0, -30, 30, 0],
            y: [0, -50, 50, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="z-10 text-center px-6 sm:px-12 max-w-4xl"
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)]">
          Welcome to{" "}
          <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
            CYBERIA
          </span>
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-gray-100 mb-6 leading-relaxed drop-shadow-md">
          A <span className="text-cyan-300 font-semibold">3D online interactive game</span>{" "}
          that helps students recognize phishing, avoid scams, and think critically in the
          digital world.
        </p>

        <p className="text-base sm:text-lg text-gray-200 leading-relaxed max-w-2xl mx-auto">
          Step into an immersive environment where you’ll learn{" "}
          <span className="font-semibold text-cyan-300">digital literacy</span> through
          choices, challenges, and scenarios — empowering you to be a{" "}
          <span className="text-cyan-400 font-semibold">smart, safe, and responsible</span>{" "}
          digital citizen.
        </p>
      </motion.div>
    </main>
  );
}
