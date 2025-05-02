import Image from "next/image";

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 md:p-24 bg-cover bg-center"
      style={{
        backgroundImage: "url('/biomekeeperbg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex flex-col items-center justify-center w-full h-full text-center">
        <h1 className="typewriter text-4xl sm:text-5xl md:text-7xl font-medium text-white mb-4">
          Welcome to Biome Keeper
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white mt-2 md:mt-4 max-w-2xl">
          Your adventure in the world of biomes begins here! Based on the K to 12 Aquaculture Exploratory Course.
        </p>
        <Image
          src="/biomekeeper.png"
          alt="Biome Keeper Logo"
          width={200}
          height={200}
          className="my-8 sm:my-10 md:my-12"
        />
      </div>
    </main>
  );
}
