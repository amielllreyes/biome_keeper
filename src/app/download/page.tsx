'use client';

import { useState } from 'react';
import Image from "next/image";
import { motion } from "framer-motion";

export default function Download() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = () => {
    setDownloading(true);
    let currentProgress = 0;

    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 10) + 5;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          window.location.href = '/BiomeKeeper.zip';
        }, 500);
      }
      setProgress(currentProgress);
    }, 300);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 to-blue-900/50"></div>
        <Image
          src="/biomekeeperbg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
      </div>


      <div className="container mx-auto px-4 py-16 min-h-screen flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl text-center"
        >

          <motion.h1
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6"
          >
            Download <span className="text-emerald-400">Biome Keeper</span>
          </motion.h1>


          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto"
          >
            Embark on your farming adventure! Protect, grow, and sustain your biome in this immersive 3D educational experience.
          </motion.p>


          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 flex justify-center"
          >
            <Image
              src="/biomekeeper.png"
              alt="Biome Keeper Logo"
              width={220}
              height={220}
              className="rounded-xl shadow-xl hover:scale-105 transition-transform duration-300"
              priority
            />
          </motion.div>


          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            {!downloading ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="relative overflow-hidden px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl text-lg shadow-lg hover:shadow-emerald-500/30 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Now
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
              </motion.button>
            ) : (
              <div className="w-full max-w-md mx-auto space-y-4">

                <div className="relative h-4 bg-gray-300/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="absolute h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {progress}%
                    </span>
                  </div>
                </div>


                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/80 text-sm"
                >
                  {progress < 100 ? (
                    "Downloading your adventure..."
                  ) : (
                    <span className="text-emerald-400 font-medium">Download complete! Starting installation...</span>
                  )}
                </motion.p>
              </div>
            )}
          </motion.div>


          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto"
          >
            <h3 className="text-xl font-semibold text-emerald-400 mb-3">System Requirements</h3>
            <ul className="text-left text-white/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">✓</span> OS: Windows 10/11 64-bit
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">✓</span> Processor: Intel i5 or equivalent
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">✓</span> Memory: 8GB RAM
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">✓</span> Graphics: 2GB VRAM
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">✓</span> Storage: 5GB available space
              </li>
              <li className="flex items-start">
                <span className="text-emerald-400 mr-2">✓</span> Internet: Required for activation
              </li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}