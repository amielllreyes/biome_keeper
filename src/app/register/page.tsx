'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Auto-generate username from email
      const username = email.split('@')[0] || 'Player';

      // Save user info to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: username,
        email,
        role: 'user',
        createdAt: new Date(),
        emailVerified: false
      });

      setMessage('Verification email sent! Please check your inbox before signing in.');

      // Optionally sign out immediately after registration
      await auth.signOut();
    } catch (error: any) {
      setError(
        error.message.includes('email-already-in-use')
          ? 'Email already in use'
          : 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <motion.form
          onSubmit={handleRegister}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100"
        >
          <div className="p-6 bg-gradient-to-r from-blue-800 to-indigo-700 text-center text-white">
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="text-blue-200 mt-1">Join Cyberia: Learn Digital Literacy</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg border border-green-100 text-sm">
                {message}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiMail className="inline mr-2" />
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiLock className="inline mr-2" />
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 mb-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-blue-800 to-indigo-700 text-white font-medium rounded-lg shadow-md transition-all ${
                isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-600'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block mr-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
                      />
                    </svg>
                  </motion.span>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Create Account <FiArrowRight className="ml-2" />
                </span>
              )}
            </motion.button>
          </div>

          <div className="px-6 py-4 bg-gray-50 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-700 hover:text-blue-900 font-medium">
                Sign In
              </a>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
