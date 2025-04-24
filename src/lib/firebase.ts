
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBBWdbV-S3u0b5O07c6kYllU5JodUjjzSE',
  authDomain: 'biomekeeper-47013.firebaseapp.com',
  projectId: 'biomekeeper-47013',
  storageBucket: 'biomekeeper-47013.firebasestorage.app',
  messagingSenderId: '668578603763',
  appId: '1:668578603763:web:e0b0a6123abc6bd88ccd86',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
