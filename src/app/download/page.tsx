'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-900">
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 py-12 md:py-20"
      >
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Left Column - Game Visual */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full lg:w-1/2 flex justify-center"
          >
            <div className="relative group">
              <div className="absolute -inset-2 bg-emerald-500/30 rounded-2xl blur-lg group-hover:opacity-75 transition-opacity duration-300"></div>
              <Image
                src="/biomekeeper.png"
                alt="Biome Keeper Game Preview"
                width={500}
                height={500}
                className="relative rounded-2xl shadow-2xl transform transition-all duration-500 group-hover:-translate-y-2"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl"></div>
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <span className="inline-block px-3 py-1 bg-emerald-600/90 text-white text-sm font-medium rounded-full backdrop-blur-sm">
                  Ready to Play
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Content */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full lg:w-1/2 max-w-xl"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Biome Keeper
                </span> <br />
                Awaits Your Journey
              </h1>

              <p className="text-lg text-white/80 mb-8 leading-relaxed">
                Immerse yourself in a breathtaking 3D educational adventure where you'll nurture ecosystems, combat environmental threats, and discover the delicate balance of nature.
              </p>

              <div className="mb-10">
                {!downloading ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownload}
                    className="relative w-full max-w-md mx-auto overflow-hidden px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl text-lg shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Now
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  </motion.button>
                ) : (
                  <div className="w-full max-w-md mx-auto space-y-4">
                    <div className="relative h-3 bg-gray-300/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                        className="absolute h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"
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
                      className={`text-center ${progress < 100 ? 'text-white/80' : 'text-emerald-400 font-medium'}`}
                    >
                      {progress < 100 ? (
                        <>
                          Downloading at {(Math.random() * 5 + 2).toFixed(1)} MB/s...
                          <span className="block text-xs mt-1 text-white/60">Estimated time: {Math.floor((100 - progress) / 5)} seconds</span>
                        </>
                      ) : (
                        "Download complete! Preparing your adventure..."
                      )}
                    </motion.p>
                  </div>
                )}
              </div>

             
            </motion.div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}