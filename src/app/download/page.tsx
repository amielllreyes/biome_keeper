import Image from "next/image";

export default function Download() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-between p-24 bg-cover bg-center"
      style={{
        backgroundImage: "url('/biomekeeperbg.png')",
        backgroundSize: 'cover', 
        backgroundPosition: 'center center', 
        backgroundRepeat: 'no-repeat', 
      }}
    >
      <div className="flex flex-col items-center justify-center w-full h-full">
        <h1 className="text-5xl font-medium text-white mb-4">Download Biome Keeper</h1>
        <p className="text-lg text-white mb-8">Get ready to explore the world of biomes!</p>
        <Image
          src="/biomekeeper.png"
          alt="Biome Keeper Logo"
          width={300}
          height={300}
          className="mb-8"
        />
        <a href="/download" className="bg-emerald-700 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition duration-300">
          Download Now
        </a>
      </div>
      
      
    </main>
  );
}
