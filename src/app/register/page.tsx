'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiLock, FiBook, FiArrowRight } from 'react-icons/fi';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role,
        createdAt: new Date()
      });

      router.push('/login');
    } catch (error: any) {
      setError(error.message.includes('email-already-in-use') 
        ? 'Email already in use' 
        : error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <motion.form
          onSubmit={handleRegister}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-green-100"
        >
 
          <motion.div
            initial={{ backgroundPosition: '0% 50%' }}
            animate={{ backgroundPosition: '100% 50%' }}
            transition={{
              duration: 8,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear'
            }}
            style={{
              backgroundImage: 'linear-gradient(45deg, #16a34a, #22c55e, #4ade80, #86efac)',
              backgroundSize: '300% 300%'
            }}
            className="p-6 text-center"
          >
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white"
            >
              Create an Account
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-green-100 mt-1"
            >
              Join our learning community
            </motion.p>
          </motion.div>


          <div className="p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100"
              >
                {error}
              </motion.div>
            )}

  
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiUser className="inline mr-2" />
                Full Name
              </label>
              <motion.input
                whileFocus={{ 
                  scale: 1.01,
                  boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.5)'
                }}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none transition-all"
                required
              />
            </motion.div>


            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiMail className="inline mr-2" />
                Email
              </label>
              <motion.input
                whileFocus={{ 
                  scale: 1.01,
                  boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.5)'
                }}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none transition-all"
                placeholder="your@email.com"
                required
              />
            </motion.div>


            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-4"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiLock className="inline mr-2" />
                Password
              </label>
              <motion.input
                whileFocus={{ 
                  scale: 1.01,
                  boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.5)'
                }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </motion.div>


            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-6"
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiBook className="inline mr-2" />
                Select Role
              </label>
              <motion.select
                whileFocus={{ 
                  scale: 1.01,
                  boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.5)'
                }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none transition-all appearance-none"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </motion.select>
            </motion.div>


            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium rounded-lg shadow transition-all duration-300 ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block mr-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                    </svg>
                  </motion.span>
                  Creating Account...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Register <FiArrowRight className="ml-2" />
                </span>
              )}
            </motion.button>
          </div>


          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="px-6 py-4 bg-gray-50 text-center"
          >
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a 
                href="/login" 
                className="text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                Sign In
              </a>
            </p>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
}