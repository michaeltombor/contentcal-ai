// src/lib/stores/authStore.ts
import { writable, derived, type Readable } from 'svelte/store';
import type { User, UserCredential } from 'firebase/auth';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    type Auth
} from 'firebase/auth';
import { browser } from '$app/environment';

// Types
export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: AuthState = {
    user: null,
    loading: true,
    error: null
};

// Define the shape of our store
export interface AuthStore {
    subscribe: Readable<AuthState>['subscribe'];
    signUp: (email: string, password: string) => Promise<UserCredential>;
    signIn: (email: string, password: string) => Promise<UserCredential>;
    signInWithGoogle: () => Promise<UserCredential>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
}

/**
 * Creates an authentication store with Firebase authentication
 * @param auth - Firebase auth instance
 * @returns An enhanced store with auth methods
 */
export function createAuthStore(auth: Auth): AuthStore {
    const authStore = writable<AuthState>(initialState);

    // Initialize auth state listener when in browser environment
    if (browser) {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                authStore.update(state => ({ ...state, user, loading: false }));
            },
            (error) => {
                console.error('Auth state error:', error);
                authStore.update(state => ({ ...state, error: error.message, loading: false }));
            }
        );
    }

    // Auth methods
    const signUp = async (email: string, password: string): Promise<UserCredential> => {
        authStore.update(state => ({ ...state, loading: true, error: null }));
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            return credential;
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to sign up';
            authStore.update(state => ({ ...state, error: errorMessage, loading: false }));
            throw error;
        }
    };

    const signIn = async (email: string, password: string): Promise<UserCredential> => {
        authStore.update(state => ({ ...state, loading: true, error: null }));
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            return credential;
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to sign in';
            authStore.update(state => ({ ...state, error: errorMessage, loading: false }));
            throw error;
        }
    };

    const signInWithGoogle = async (): Promise<UserCredential> => {
        authStore.update(state => ({ ...state, loading: true, error: null }));
        try {
            const provider = new GoogleAuthProvider();
            const credential = await signInWithPopup(auth, provider);
            return credential;
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to sign in with Google';
            authStore.update(state => ({ ...state, error: errorMessage, loading: false }));
            throw error;
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            await firebaseSignOut(auth);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to sign out';
            authStore.update(state => ({ ...state, error: errorMessage }));
            throw error;
        }
    };

    const resetPassword = async (email: string): Promise<void> => {
        authStore.update(state => ({ ...state, loading: true, error: null }));
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to reset password';
            authStore.update(state => ({ ...state, error: errorMessage, loading: false }));
            throw error;
        } finally {
            authStore.update(state => ({ ...state, loading: false }));
        }
    };

    const updateUserProfile = async (displayName?: string, photoURL?: string): Promise<void> => {
        authStore.update(state => ({ ...state, loading: true, error: null }));
        try {
            if (!auth.currentUser) {
                throw new Error('No authenticated user');
            }
            await updateProfile(auth.currentUser, {
                displayName: displayName || auth.currentUser.displayName,
                photoURL: photoURL || auth.currentUser.photoURL
            });
            // Force update store to reflect changes
            authStore.update(state => ({ ...state, user: auth.currentUser }));
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to update profile';
            authStore.update(state => ({ ...state, error: errorMessage }));
            throw error;
        } finally {
            authStore.update(state => ({ ...state, loading: false }));
        }
    };

    return {
        subscribe: authStore.subscribe,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateUserProfile
    };
}

// Helper derived stores with proper typing
export function isAuthenticated(authStore: AuthStore): Readable<boolean> {
    return derived<Readable<AuthState>, boolean>(
        authStore as unknown as Readable<AuthState>,
        ($state) => $state.user !== null
    );
}

export function isAdmin(authStore: AuthStore): Readable<boolean> {
    return derived<Readable<AuthState>, boolean>(
        authStore as unknown as Readable<AuthState>,
        ($state) => {
            // Check for custom claims - requires Firebase Functions to be set up
            // This is just a placeholder until you implement custom claims
            return $state.user?.email?.endsWith('@contentcal.ai') || false;
        }
    );
}