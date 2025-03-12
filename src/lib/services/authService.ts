import { auth } from './firebaseConfig';
import { browser } from '$app/environment';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    type User,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    type UserCredential
} from 'firebase/auth';
import { writable, derived, type Writable } from 'svelte/store';

// Create a store for the current user
export const userStore: Writable<User | null> = writable(null);
export const isAuthenticated = derived(userStore, $user => $user !== null);
export const isLoading = writable(true);

// Initialize auth state listener
export function initAuth() {
    if (!browser) return;

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
        userStore.set(user);
        isLoading.set(false);
    });

    return unsubscribe;
}

// Register a new user with email and password
export async function registerWithEmail(email: string, password: string, displayName: string): Promise<UserCredential> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update the user's profile with display name
        if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
            await sendEmailVerification(userCredential.user);
        }

        return userCredential;
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
    try {
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
    try {
        const provider = new GoogleAuthProvider();
        return await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
}

// Sign out
export async function logOut(): Promise<void> {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

// Send password reset email
export async function resetPassword(email: string): Promise<void> {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

// Update user profile
export async function updateUserProfile(displayName: string, photoURL?: string): Promise<void> {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        await updateProfile(user, { displayName, photoURL });

        // Update the store
        userStore.update(currentUser => {
            if (currentUser) {
                return { ...currentUser, displayName, photoURL };
            }
            return currentUser;
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}