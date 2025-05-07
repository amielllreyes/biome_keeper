'use client';

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutUs() {
  return (
    <div className="relative flex flex-col min-h-[calc(100vh-160px)] overflow-hidden">

      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 to-blue-900/40"></div>
        <Image
          src="/biomekeeperbg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-noise opacity-10"></div>
      </div>

      {/* Floating decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-400/20"
            initial={{
              x: Math.random() * 100,
              y: Math.random() * 100,
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              opacity: 0.3
            }}
            animate={{
              x: [null, Math.random() * 100 - 50],
              y: [null, Math.random() * 100 - 50],
              opacity: [0.3, 0.4, 0.3]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex items-center justify-center px-4 py-8"
      >

        <div className="w-full max-w-4xl bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl shadow-emerald-900/20 border border-white/30 my-8 max-h-[80vh] overflow-y-auto relative">
          
          {/* Glow effect */}
          <div className="absolute -inset-2 bg-emerald-500/10 rounded-xl blur-xl -z-10"></div>

          {/* Header with improved gradient */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-600 p-5 text-center sticky top-0 z-10 border-b border-emerald-500/30">
            <motion.div 
              initial={{ scale: 0.9, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="space-y-2"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                About <span className="text-emerald-100 font-extrabold">Biome Keeper</span>
              </h1>
              <div className="w-20 h-1 bg-emerald-300/70 mx-auto rounded-full"></div>
            </motion.div>
          </div>

          {/* Content with better spacing and typography */}
          <div className="p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <p className="text-lg sm:text-xl md:text-2xl text-gray-800 leading-relaxed font-medium">
                <strong className="text-emerald-700 font-bold">Biome Keeper</strong> is an immersive 3D educational simulation game based on the{" "}
                <span className="text-emerald-800 font-semibold italic">K to 12 Aquaculture Exploratory Course</span>.
              </p>

              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-600 p-5 sm:p-6 rounded-r-lg shadow-sm"
              >
                <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                  Our game transforms important topics like:
                </h3>
                <ul className="space-y-3 pl-2">
                  {[
                    "Crop maintenance and optimization",
                    "Integrated pest management strategies",
                    "Proper use of fishery tools and equipment",
                    "Safety protocols for farm operations",
                    "Sustainable and eco-friendly farming practices"
                  ].map((item, index) => (
                    <motion.li 
                      key={index}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-start text-gray-700 text-base sm:text-lg"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 mr-2 mt-0.5">
                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-white p-5 rounded-lg border border-emerald-100 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-emerald-700 mb-3">Engaging Learning</h3>
                  <p className="text-gray-700">
                    Our 3D environment makes complex concepts tangible through interactive simulations and real-world scenarios.
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="bg-white p-5 rounded-lg border border-emerald-100 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-emerald-700 mb-3">Curriculum-Aligned</h3>
                  <p className="text-gray-700">
                    Designed specifically to complement the K to 12 Aquaculture curriculum with accurate, up-to-date content.
                  </p>
                </motion.div>
              </div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="text-lg sm:text-xl text-gray-800 mt-6 leading-relaxed text-center bg-emerald-50/50 p-5 rounded-lg border border-emerald-100"
              >
                <span className="text-emerald-600 font-semibold">Experience learning like never before</span> with our immersive adventure that makes education engaging, interactive, and fun!
              </motion.p>
            </motion.div>
          </div>

          {/* Footer with improved design */}
          <div className="sticky bottom-0 bg-gradient-to-b from-white/90 to-white/70 border-t border-gray-200/50 p-4 text-center backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="space-y-2"
            >
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                Thank you for your support! We hope you enjoy your journey in the world of biomes!
              </p>
              <div className="flex justify-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-emerald-500 rounded-full"
                    animate={{ 
                      y: [0, -5, 0],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}