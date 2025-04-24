'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch role from Firestore
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        alert('User data not found in Firestore.');
        return;
      }

      const userData = docSnap.data();
      const role = userData.role;

     
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'student') {
        router.push('/student/dashboard');
      } else if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        alert('Unknown role. Please contact administrator.');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-green-50">
      <form onSubmit={handleLogin} className="bg-white shadow-md rounded px-8 py-6 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-green-700 mb-6">Login</h2>

        <label className="block mb-2 text-sm font-medium text-gray-600">Email</label>
        <input
          type="email"
          className="w-full px-4 py-2 mb-4 border rounded"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block mb-2 text-sm font-medium text-gray-600">Password</label>
        <input
          type="password"
          className="w-full px-4 py-2 mb-6 border rounded"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
