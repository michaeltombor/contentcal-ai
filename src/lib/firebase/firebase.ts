// src/lib/firebase/firebase.ts
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { browser } from '$app/environment';

// Your Firebase configuration
// Store this in environment variables for production
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Singleton pattern to ensure we only initialize Firebase once
let firebaseApp: FirebaseApp;
let firebaseAuth: Auth;
let firebaseFirestore: Firestore;
let firebaseStorage: FirebaseStorage;
let firebaseFunctions: Functions;
let firebaseAnalytics: Analytics | null = null;

/**
 * Initialize Firebase app
 * @returns Initialized Firebase app instance
 */
export function initFirebase(): FirebaseApp {
    if (!firebaseApp) {
        firebaseApp = initializeApp(firebaseConfig);
    }
    return firebaseApp;
}

/**
 * Get Firebase Auth instance
 * @returns Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
    if (!firebaseAuth) {
        const app = initFirebase();
        firebaseAuth = getAuth(app);

        // Set persistence based on environment for improved DX
        if (browser && import.meta.env.DEV) {
            import('firebase/auth').then(({ setPersistence, browserSessionPersistence }) => {
                setPersistence(firebaseAuth, browserSessionPersistence);
            });
        }
    }
    return firebaseAuth;
}

/**
 * Get Firebase Firestore instance
 * @returns Firebase Firestore instance
 */
export function getFirebaseFirestore(): Firestore {
    if (!firebaseFirestore) {
        const app = initFirebase();
        firebaseFirestore = getFirestore(app);

        // Enable offline persistence for better UX
        if (browser) {
            import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
                enableIndexedDbPersistence(firebaseFirestore).catch((err) => {
                    console.warn('Firestore offline persistence failed to initialize:', err.code);
                });
            });
        }
    }
    return firebaseFirestore;
}

/**
 * Get Firebase Storage instance
 * @returns Firebase Storage instance
 */
export function getFirebaseStorage(): FirebaseStorage {
    if (!firebaseStorage) {
        const app = initFirebase();
        firebaseStorage = getStorage(app);
    }
    return firebaseStorage;
}

/**
 * Get Firebase Functions instance
 * @returns Firebase Functions instance
 */
export function getFirebaseFunctions(): Functions {
    if (!firebaseFunctions) {
        const app = initFirebase();
        firebaseFunctions = getFunctions(app);

        // Use local emulator in development
        if (import.meta.env.DEV) {
            import('firebase/functions').then(({ connectFunctionsEmulator }) => {
                connectFunctionsEmulator(firebaseFunctions, 'localhost', 5001);
            });
        }
    }
    return firebaseFunctions;
}

/**
 * Get Firebase Analytics instance
 * @returns Firebase Analytics instance or null if not supported
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
    if (browser && !firebaseAnalytics) {
        const app = initFirebase();
        const analyticsSupported = await isSupported();

        if (analyticsSupported) {
            firebaseAnalytics = getAnalytics(app);
        } else {
            console.warn('Firebase Analytics is not supported in this environment');
        }
    }
    return firebaseAnalytics;
}