// Import the Firebase SDK components
import { initializeApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import { browser } from '$app/environment';

// Your web app's Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase only in the browser
const app = browser ? initializeApp(firebaseConfig) : undefined;

export const db: Firestore | undefined = app ? getFirestore(app) : undefined;
export const auth: Auth | undefined = app ? getAuth(app) : undefined;
export const storage: FirebaseStorage | undefined = app ? getStorage(app) : undefined;
export const functions: Functions | undefined = app ? getFunctions(app) : undefined;

// Use emulators in development
if (browser && import.meta.env.DEV) {
    if (auth) connectAuthEmulator(auth, 'http://localhost:9099');
    if (functions) connectFunctionsEmulator(functions, 'localhost', 5001);
}