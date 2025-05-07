'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type MessageType = {
  text: string;
  type: 'error' | 'success' | 'info' | '';
};

type AuthStep = 'login' | 'sendLink' | 'forgotPassword';

export default function SecureEmailLinkAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<MessageType>({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('login');
  const [isEmailLinkLoginComplete, setIsEmailLinkLoginComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const authInstance = getAuth();

    if (isSignInWithEmailLink(authInstance, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');

      if (!email) {
        email = window.prompt('Please provide your email for confirmation') || '';
      }

      if (email) {
        setIsLoading(true);
        setMessage({ text: 'Signing you in...', type: 'info' });

        signInWithEmailLink(authInstance, email, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            setIsEmailLinkLoginComplete(true);
            await checkUserRoleAndRedirect(result.user);
          })
          .catch((error) => {
            setMessage({ text: `Error signing in: ${error.message}`, type: 'error' });
            setIsLoading(false);
          });
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && isEmailLinkLoginComplete) {
        checkUserRoleAndRedirect(user);
      }
    });
    return () => unsubscribe();
  }, [isEmailLinkLoginComplete, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStep('sendLink');
      setMessage({ text: 'Credentials verified. You can now request the sign-in link.', type: 'success' });
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        setMessage({ text: 'Login failed: Wrong email or password.', type: 'error' });
      } else {
        setMessage({ text: `Login failed: ${error.message}`, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage({ text: `Sign-in link sent to ${email}. Check your email!`, type: 'success' });
    } catch (error: any) {
      setMessage({ text: `Error sending link: ${error.message}`, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ 
        text: `Password reset email sent to ${email}. Check your inbox!`, 
        type: 'success' 
      });
      setTimeout(() => setStep('login'), 3000);
    } catch (error: any) {
      setMessage({ 
        text: `Error sending reset email: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserRoleAndRedirect = async (user: User) => {
    try {
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
    } catch (error) {
      setMessage({ text: 'Failed to fetch user data', type: 'error' });
    }
  };

  const getMessageClass = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex w-1/2 bg-gradient-to-br from-green-700 to-green-600 items-center justify-center text-white"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center p-8"
        >
          <motion.h1 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold mb-4"
          >
            Welcome to Biome Keeper
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg"
          >
            Your Adventure in the World of Biomes Begins Here!
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Right Side - Auth Forms */}
      <div className="flex w-full md:w-1/2 justify-center items-center bg-white p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: step === 'login' ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: step === 'login' ? -50 : 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md"
          >
            {step === 'login' ? (
              <form onSubmit={handleLogin}>
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-green-700 mb-6"
                >
                  Verify Your Credentials
                </motion.h2>

                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`mb-4 p-3 rounded ${getMessageClass(message.type)}`}
                  >
                    {message.text}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block mb-2 text-sm font-medium text-gray-600">Email</label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="email"
                    className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block mb-2 text-sm font-medium text-gray-600">Password</label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="password"
                    className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </motion.div>

                <div className="flex justify-between items-center mb-4">
                  <motion.button
                    type="button"
                    onClick={() => setStep('forgotPassword')}
                    className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Forgot password?
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-lg shadow-md transition-all ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
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
                      Verifying...
                    </span>
                  ) : 'Verify Credentials'}
                </motion.button>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-sm text-center text-gray-600"
                >
                  Don't have an account?{' '}
                  <Link href="/register" className="text-green-600 hover:text-green-800 font-medium transition-colors">
                    Register
                  </Link>
                </motion.p>
              </form>
            ) : step === 'sendLink' ? (
              <form onSubmit={handleSendLink}>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-green-700 mb-6"
                >
                  Request Sign-In Link
                </motion.h2>

                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`mb-4 p-3 rounded ${getMessageClass(message.type)}`}
                  >
                    {message.text}
                  </motion.div>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 text-gray-600"
                >
                  Your credentials have been verified. Click below to receive your secure sign-in link.
                </motion.p>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-lg shadow-md transition-all ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Sending...' : 'Send Sign-In Link'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setMessage({ text: '', type: '' });
                  }}
                  className="w-full mt-4 py-2 text-green-600 hover:text-green-800 font-medium transition-colors"
                >
                  Back to Login
                </motion.button>
              </form>
            ) : (
              /* Forgot Password Form */
              <form onSubmit={handleForgotPassword}>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-green-700 mb-6"
                >
                  Reset Your Password
                </motion.h2>

                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`mb-4 p-3 rounded ${getMessageClass(message.type)}`}
                  >
                    {message.text}
                  </motion.div>
                )}

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6 text-gray-600"
                >
                  Enter your email address and we'll send you a link to reset your password.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block mb-2 text-sm font-medium text-gray-600">Email</label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="email"
                    className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-lg shadow-md transition-all ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setStep('login');
                    setMessage({ text: '', type: '' });
                  }}
                  className="w-full mt-4 py-2 text-green-600 hover:text-green-800 font-medium transition-colors"
                >
                  Back to Login
                </motion.button>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}