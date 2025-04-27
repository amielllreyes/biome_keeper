'use client';

import { useState } from 'react';
import Image from "next/image";

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
        window.location.href = '/BiomeKeeper.zip'; 
      }
      setProgress(currentProgress);
    }, 300);
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16 bg-cover bg-center text-white"
      style={{
        backgroundImage: "url('/biomekeeperbg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <h1 className="text-5xl font-bold mb-6">Download Biome Keeper</h1>

      <p className="text-lg mb-8">
        Embark on your farming adventure! Protect, grow, and sustain your biome.
      </p>

      <div className="flex justify-center mb-8">
        <Image
          src="/biomekeeper.png"
          alt="Biome Keeper Logo"
          width={200}
          height={200}
          className="rounded-lg shadow-md hover:scale-105 transition-transform duration-300"
        />
      </div>

      {!downloading ? (
        <button
          onClick={handleDownload}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg text-lg transition duration-300 shadow-md"
        >
          Download Now
        </button>
      ) : (
        <div className="w-full max-w-sm bg-gray-300 rounded-full h-6 overflow-hidden mt-4">
          <div
            className="bg-emerald-600 h-6 rounded-full text-center text-white text-sm font-medium"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}
    </main>
  );
}
