"use client";
import { useEffect } from "react";

export default function Home() {
  // Smooth scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const aboutSection = document.getElementById("about");
      if (window.scrollY > window.innerHeight * 0.3 && aboutSection) {
        aboutSection.classList.add("fade-in");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white overflow-x-hidden">
      {/* HERO SECTION */}
      <section
        className="flex flex-col items-center justify-center relative w-full min-h-screen text-center px-6 sm:px-10 md:px-20 bg-cover bg-center"
        style={{
          backgroundImage: "url('/Cyberia.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0"></div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-cyan-300 mb-4 drop-shadow-[0_0_20px_rgba(34,211,238,0.7)] animate-fadeIn">
            Welcome to <span className="text-white">CYBERIA</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl leading-relaxed text-cyan-50 mt-4 bg-white/10 border border-cyan-400/30 rounded-2xl p-6 sm:p-8 backdrop-blur-lg shadow-[0_0_25px_rgba(34,211,238,0.25)]">
            Step into a <span className="text-cyan-300 font-semibold">3D interactive world</span> where learning meets
            adventure. <span className="font-semibold">Cyberia</span> is a game designed to teach
            <span className="italic"> digital literacy</span> — helping players identify phishing emails, avoid scams, 
            and make responsible decisions in the online world. Through exploration and decision-making, players gain 
            awareness of the threats that exist in the digital landscape.
          </p>

          <p className="text-cyan-100 mt-6 text-lg italic opacity-90">
            “Empowering the next generation to think critically and stay safe online.”
          </p>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="animate-pulse w-2 h-2 bg-cyan-300/70 rounded-full absolute top-1/3 left-1/4 blur-sm"></div>
            <div className="animate-ping w-3 h-3 bg-cyan-400/60 rounded-full absolute top-2/3 right-1/3 blur-md"></div>
            <div className="animate-pulse w-2 h-2 bg-cyan-200/50 rounded-full absolute bottom-1/4 right-1/5 blur-sm"></div>
          </div>
        </div>
      </section>

      {/* ABOUT THE PROJECT SECTION */}
      <section
        id="about"
        className="w-full bg-gradient-to-b from-black via-gray-900 to-black text-center py-24 px-6 sm:px-12 md:px-24 opacity-0 transition-opacity duration-1000"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-cyan-300 mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
            About the Project
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 leading-relaxed">
            <span className="font-semibold text-cyan-200">CYBERIA: The Internet Safety Game</span> is a 
            3D educational simulation that aims to strengthen students’ awareness and understanding of 
            digital threats such as phishing, scams, and misinformation. The project integrates 
            <span className="text-cyan-300"> gamified learning</span> to make cybersecurity education 
            more engaging and effective. <br /> <br />
            Designed for <span className="font-semibold text-cyan-200">Digital Literacy</span> instruction, 
            the game allows players to explore realistic online environments where they must analyze messages, 
            identify suspicious activity, and make smart choices — turning theoretical lessons into practical 
            experiences.
          </p>
          <p className="text-cyan-100 mt-8 text-lg">
            This project demonstrates how gamification can transform education into an interactive and meaningful experience.
          </p>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1.2s ease-in-out forwards;
        }
        .fade-in {
          opacity: 1 !important;
        }
      `}</style>
    </main>
  );
}
