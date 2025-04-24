'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        router.push('/profile');
        return;
      }

      const userData = userSnap.data();
      const role = userData.role;

      if (role === 'student') {
        router.push('/profile');
      } else if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/congratulations');
      }

    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex w-1/2 bg-green-700 items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Biome Keeper</h1>
          <p className="text-lg">Your Adventure in the World of Biomes Begins Here!</p>
        </div>
      </div>

      <div className="flex w-full md:w-1/2 justify-center items-center bg-white p-8">
        <form onSubmit={handleLogin} className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-green-700 mb-6">Login</h2>

          <label className="block mb-2 text-sm font-medium text-gray-600">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="block mb-2 text-sm font-medium text-gray-600">Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex items-center justify-between mb-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm">Remember Me</span>
            </label>
            <Link href="/forgotpassword" className="text-sm text-green-600 hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
          >
            Login
          </button>

          <p className="mt-6 text-sm text-center">
            Don’t have an account?{' '}
            <Link href="/register" className="text-green-600 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
