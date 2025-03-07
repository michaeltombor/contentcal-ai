// src/lib/stores/authStore.js
import { writable } from 'svelte/store';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '$lib/firebase/firebase';

// Create a writable store for the user
export const user = writable(null);
export const isLoading = writable(true);

// Initialize auth state listener
export const initAuth = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
        isLoading.set(true);

        if (firebaseUser) {
            // Get user data from Firestore
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                // Combine Firebase Auth info with Firestore data
                user.set({
                    ...firebaseUser,
                    ...userDoc.data()
                });
            } else {
                // If user doesn't exist in Firestore yet, just use Auth info
                user.set(firebaseUser);
            }
        } else {
            user.set(null);
        }

        isLoading.set(false);
    });
};

// Sign up function
export const signUp = async (email, password, displayName) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update profile with display name
        await updateProfile(userCredential.user, {
            displayName
        });

        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            displayName,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            settings: {
                theme: 'light',
                emailNotifications: true
            },
            preferredPostingTimes: []
        });

        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Sign in function
export const signIn = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Update last login
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            lastLogin: serverTimestamp()
        }, { merge: true });

        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Sign out function
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Reset password
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};