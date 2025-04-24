'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('✅ Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <form onSubmit={handleReset} className="bg-white p-8 rounded shadow-md max-w-sm w-full">
        <h2 className="text-2xl font-bold text-green-700 mb-6">Forgot Password</h2>

        <label className="block text-sm mb-1 text-gray-600">Enter your email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="example@email.com"
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Send Reset Link
        </button>

        {message && <p className="mt-4 text-sm text-center text-gray-700">{message}</p>}
      </form>
    </div>
  );
}
