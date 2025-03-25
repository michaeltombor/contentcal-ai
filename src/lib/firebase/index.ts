// src/lib/firebase/index.ts
/**
 * Central Firebase export file that ensures single initialization
 * Import ONLY from this file throughout your application
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { browser } from '$app/environment';

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase app is already initialized
let app;
try {
    // If app already exists, get it
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
    console.error("Firebase initialization error:", error);
    app = initializeApp(firebaseConfig, "ContentCalAI"); // Use unique name as fallback
}

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Connect to emulators in development if enabled
if (browser && import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        connectStorageEmulator(storage, 'localhost', 9199);
        connectFunctionsEmulator(functions, 'localhost', 5001);
        console.log('Connected to Firebase emulators');
    } catch (error) {
        console.error('Failed to connect to Firebase emulators:', error);
    }
}

export { app, auth, db, storage, functions };

// Helper functions
export function getCurrentUser() {
    return auth.currentUser;
}

export function isAuthenticated() {
    return !!auth.currentUser;
}