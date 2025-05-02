'use client';

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutUs() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-160px)]">

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-blue-900/30"></div>
        <Image
          src="/biomekeeperbg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
      </div>


      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex items-center justify-center px-4 py-8"
      >

        <div className="w-full max-w-4xl bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl border border-white/30 my-8 max-h-[80vh] overflow-y-auto">
          

          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-center sticky top-0 z-10">
            <motion.h1 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-white"
            >
              About <span className="text-emerald-100">Biome Keeper</span>
            </motion.h1>
          </div>

 
          <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-gray-800 leading-relaxed"
            >
              <strong className="text-emerald-700 font-semibold">Biome Keeper</strong> is a 3D educational simulation game based on the{" "}
              <span className="text-emerald-800 font-medium italic">K to 12 Aquaculture Exploratory Course</span>.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-emerald-50/50 border-l-4 border-emerald-500 p-3 sm:p-4 rounded-r-lg"
            >
              <p className="text-gray-700 text-sm sm:text-base">
                Our game transforms important topics like:
              </p>
              <ul className="mt-2 space-y-2 pl-4 sm:pl-5">
                {[
                  "Crop maintenance",
                  "Pest management",
                  "Fishery tool equipment",
                  "Safety measures on farm operations",
                  "Sustainable farming practices"
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start text-gray-700 text-sm sm:text-base"
                  >
                    <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-2"></span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-base sm:text-lg text-gray-700 mt-4 sm:mt-6 leading-relaxed"
            >
              Into a <span className="text-emerald-600 font-medium">fun and immersive adventure</span> that makes learning engaging and interactive!
            </motion.p>
          </div>


          <div className="sticky bottom-0 bg-gray-50/70 border-t border-gray-200/50 p-3 sm:p-4 text-center backdrop-blur-sm">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs sm:text-sm text-gray-600"
            >
              Thank you for your support! We hope you enjoy your journey in the world of biomes!
            </motion.p>
            <div className="mt-1 sm:mt-2 flex justify-center space-x-3">
              {[1, 2, 3].map((item) => (
                <motion.div
                  key={item}
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    delay: item * 0.3
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}