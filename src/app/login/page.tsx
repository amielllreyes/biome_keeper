'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
} from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function SecureEmailLinkAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'login' | 'sendLink'>('login');
  const [isEmailLinkLoginComplete, setIsEmailLinkLoginComplete] = useState(false);
  const router = useRouter();


  useEffect(() => {
    const authInstance = getAuth();

    if (isSignInWithEmailLink(authInstance, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');

      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }

      if (email) {
        setIsLoading(true);
        setMessage('Signing you in...');

        signInWithEmailLink(authInstance, email, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            setIsEmailLinkLoginComplete(true); 
            await checkUserRoleAndRedirect(result.user);
          })
          .catch((error) => {
            setMessage(`Error signing in: ${error.message}`);
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
  }, [isEmailLinkLoginComplete]); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
  
    try {
      
      await signInWithEmailAndPassword(auth, email, password);
  
     
      setStep('sendLink');
      setMessage('Credentials verified. You can now request the sign-in link.');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        setMessage('Login failed: Wrong email or password.');
      } else {
        setMessage(`Login failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setMessage(`Sign-in link sent to ${email}. Check your email!`);
    } catch (error: any) {
      setMessage(`Error sending link: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserRoleAndRedirect = async (user: any) => {
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
      setMessage('Failed to fetch user data');
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
        {step === 'login' ? (
          <form onSubmit={handleLogin} className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-green-700 mb-6">Verify Your Credentials</h2>

            {message && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
                {message}
              </div>
            )}

            <label className="block mb-2 text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className="block mb-2 text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Verifying...' : 'Verify Credentials'}
            </button>

            <p className="mt-6 text-sm text-center">
              Don't have an account?{' '}
              <Link href="/register" className="text-green-600 hover:underline">
                Register
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSendLink} className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-green-700 mb-6">Request Sign-In Link</h2>

            {message && (
              <div
                className={`mb-4 p-3 rounded ${
                  message.includes('sent')
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {message}
              </div>
            )}

            <p className="mb-4 text-gray-600">
              Your credentials have been verified. Click below to receive your secure sign-in link.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Sending...' : 'Send Sign-In Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('login');
                setMessage('');
              }}
              className="w-full mt-4 text-green-600 hover:underline"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
