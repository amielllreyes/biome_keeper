'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type MessageType = {
  text: string;
  type: 'error' | 'success' | 'info' | '';
};

type AuthStep = 'login' | 'forgotPassword';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<MessageType>({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('login');
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  // Suppress Firebase console errors in production
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      const originalError = console.error;
      console.error = (...args) => {
        // Filter out Firebase auth errors
        if (
          args[0]?.toString().includes('FirebaseError') ||
          args[0]?.toString().includes('auth/') ||
          args[0]?.code?.includes('auth/')
        ) {
          return;
        }
        originalError.apply(console, args);
      };

      return () => {
        console.error = originalError;
      };
    }
  }, []);

  // Network status detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        checkUserRoleAndRedirect(user);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      setMessage({ 
        text: 'You appear to be offline. Please check your internet connection and try again.', 
        type: 'error' 
      });
      return;
    }

    // Basic validation
    if (!email || !password) {
      setMessage({ 
        text: 'Please enter both email and password.', 
        type: 'error' 
      });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });
    setRetryCount(0);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged will handle the redirect
    } catch (error: any) {
      // Suppress console error by not logging it
      setIsLoading(false);
      
      // Handle specific Firebase auth errors with user-friendly messages
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setMessage({ 
            text: 'Invalid email or password. Please check your credentials and try again.', 
            type: 'error' 
          });
          break;
        case 'auth/invalid-email':
          setMessage({ 
            text: 'Invalid email address format. Please check your email.', 
            type: 'error' 
          });
          break;
        case 'auth/user-disabled':
          setMessage({ 
            text: 'This account has been disabled. Please contact support.', 
            type: 'error' 
          });
          break;
        case 'auth/too-many-requests':
          setMessage({ 
            text: 'Too many failed login attempts. Please try again later or reset your password.', 
            type: 'error' 
          });
          break;
        case 'auth/network-request-failed':
          setMessage({ 
            text: 'Network error. Please check your internet connection.', 
            type: 'error' 
          });
          break;
        default:
          setMessage({ 
            text: 'Unable to sign in. Please verify your credentials and try again.', 
            type: 'error' 
          });
      }
    }
  };

  const checkUserRoleAndRedirect = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      setIsLoading(false);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.email?.split('@')[0] || 'User',
          email: user.email,
          role: 'user',
          createdAt: new Date()
        });
        
        router.push('/profile');
        return;
      }

      const userData = userSnap.data();
      const role = userData.role;

      if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/profile');
      }
    } catch (error: any) {
      setIsLoading(false);
      
      if (error.code === 'failed-precondition') {
        setMessage({ 
          text: 'Network error. Please check your connection and try again.', 
          type: 'error' 
        });
      } else if (error.code === 'unavailable' && retryCount < 3) {
        setMessage({ 
          text: `Connection issue. Retrying... (${retryCount + 1}/3)`, 
          type: 'info' 
        });
        setRetryCount(prev => prev + 1);
        setTimeout(() => checkUserRoleAndRedirect(user), 2000);
      } else if (error.code === 'unavailable') {
        setMessage({ 
          text: 'Unable to connect after multiple attempts. Please check your internet connection and refresh the page.', 
          type: 'error' 
        });
      } else {
        setMessage({ 
          text: 'Failed to fetch user data. Please try again.', 
          type: 'error' 
        });
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ 
        text: 'Please enter your email address to reset your password.', 
        type: 'error' 
      });
      return;
    }

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
      if (error.code === 'auth/user-not-found') {
        setMessage({ 
          text: 'No account found with this email address.', 
          type: 'error' 
        });
      } else if (error.code === 'auth/invalid-email') {
        setMessage({ 
          text: 'Invalid email address format.', 
          type: 'error' 
        });
      } else {
        setMessage({ 
          text: 'Failed to send reset email. Please try again.', 
          type: 'error' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageClass = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const clearMessage = () => {
    setMessage({ text: '', type: '' });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 items-center justify-center text-white"
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
            Welcome to CYBERIA
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
                  className="text-2xl font-bold text-blue-900 mb-6"
                >
                  Sign In to Your Account
                </motion.h2>

                {/* Network Status */}
                {!isOnline && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      You appear to be offline. Some features may not work.
                    </div>
                  </motion.div>
                )}

                {/* Error/Success Message */}
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mb-4 p-3 rounded-lg border ${getMessageClass(message.type)}`}
                  >
                    <div className="flex justify-between items-start">
                      <span>{message.text}</span>
                      <button
                        type="button"
                        onClick={clearMessage}
                        className="ml-2 text-current hover:opacity-70"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
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
                    className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
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
                    className="text-sm text-blue-800 hover:text-blue-900 font-medium transition-colors"
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
                  className={`w-full py-3 px-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-medium rounded-lg shadow-md transition-all ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-800 hover:to-blue-700'
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
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </motion.button>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 text-sm text-center text-gray-600"
                >
                  Don't have an account?{' '}
                  <Link href="/register" className="text-blue-800 hover:text-blue-900 font-medium transition-colors">
                    Register
                  </Link>
                </motion.p>
              </form>
            ) : (
              /* Forgot Password Form */
              <form onSubmit={handleForgotPassword}>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-blue-900 mb-6"
                >
                  Reset Your Password
                </motion.h2>

                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`mb-4 p-3 rounded-lg border ${getMessageClass(message.type)}`}
                  >
                    <div className="flex justify-between items-start">
                      <span>{message.text}</span>
                      <button
                        type="button"
                        onClick={clearMessage}
                        className="ml-2 text-current hover:opacity-70"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
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
                    className="w-full px-4 py-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
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
                  className={`w-full py-3 px-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-medium rounded-lg shadow-md transition-all ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-800 hover:to-blue-700'
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
                  className="w-full mt-4 py-2 text-blue-800 hover:text-blue-900 font-medium transition-colors"
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