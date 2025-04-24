import Image from "next/image";

export default function Aboutus() {
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
      <h1>hi everyone welcome to our game biome keeper</h1>
    </main>
  );
}
