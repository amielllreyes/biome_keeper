'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      } else {
        alert('User data not found');
        router.push('/');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      alert('Error logging out');
      console.error(err);
    }
  };

  if (loading) return <p className="text-center mt-20">Loading profile...</p>;
  if (!userData) return null;

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
        <h1 className="text-3xl font-bold text-green-700 mb-4">Welcome, {userData.name}! </h1>
        <p className="text-gray-600 mb-2">📧 Email: {userData.email}</p>
        <p className="text-gray-600 mb-4">🧬 Role: {userData.role}</p>

        <hr className="my-6" />

        <h2 className="text-2xl font-semibold text-green-700 mb-2">🎮 Game Stats</h2>
        <p className="text-gray-700">Level: {userData.level ?? 'Not set'}</p>
        <p className="text-gray-700">Energy: {userData.energy ?? 'Not set'}%</p>

        <div className="mt-4">
          <h3 className="font-semibold text-green-600 mb-2">🌱 Crop Progress:</h3>
          <ul className="list-disc ml-5 text-gray-700">
            {userData.cropStats ? (
              Object.entries(userData.cropStats).map(([crop, status]) => (
                <li key={crop}>{crop}: {String(status)}</li>
              ))
            ) : (
              <li>No crop data yet</li>
            )}
          </ul>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-green-600 mb-2">✅ Completed Missions:</h3>
          <ul className="list-disc ml-5 text-gray-700">
            {(userData.completedMissions || []).length > 0 ? (
              userData.completedMissions.map((mission: string, index: number) => (
                <li key={index}>{mission}</li>
              ))
            ) : (
              <li>No missions completed yet</li>
            )}
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <a
            href="/BiomeKeeper.zip"
            download
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          >
            ⬇ Download Game
          </a>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

     
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold mb-4">Are you sure you want to log out?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Yes, Log Out
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
