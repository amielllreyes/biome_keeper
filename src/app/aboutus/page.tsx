export default function Aboutus() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16 bg-cover bg-center"
      style={{
        backgroundImage: "url('/biomekeeperbg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg p-10 max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-green-700 mb-6">About Biome Keeper</h1>

        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          <strong>Biome Keeper</strong> is a 3D educational simulation game based on the
          <em className="text-green-800"> K to 12 Aquaculture Exploratory Course</em>.
          It transforms important topics like crop maintenance, pest management, fishery tool equipments, safety measures on farm operations, and sustainable farming into a fun and immersive adventure!
        </p>


        <p className="mt-8 text-sm text-gray-500">
          Thank you for the support! We hope you enjoy your journey in the world of biomes! 
        </p>
      </div>
    </main>
  );
}
