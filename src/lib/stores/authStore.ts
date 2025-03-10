// src/lib/stores/authStore.ts

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth';

// Create a store for the current user
export const user = writable<User | null>(null);
export const isLoading = writable(true);
export const authError = writable<string | null>(null);

// Initialize auth state listener
export function initAuth() {
    if (!browser) return;

    const auth = getAuth();

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
            user.set(firebaseUser);
            isLoading.set(false);
        },
        (error) => {
            console.error('Auth state error:', error);
            authError.set(error.message);
            isLoading.set(false);
        }
    );

    return unsubscribe;
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<void> {
    try {
        authError.set(null);
        isLoading.set(true);

        const auth = getAuth();
        await signInWithEmailAndPassword(auth, email, password);

        // Auth state listener will update the user store
    } catch (error) {
        console.error('Sign in error:', error);
        if (error instanceof Error) {
            authError.set(error.message);
        } else {
            authError.set('An unknown error occurred');
        }
        isLoading.set(false);
        throw error;
    }
}

// Sign up with email and password
export async function signUp(email: string, password: string): Promise<void> {
    try {
        authError.set(null);
        isLoading.set(true);

        const auth = getAuth();
        await createUserWithEmailAndPassword(auth, email, password);

        // Auth state listener will update the user store
    } catch (error) {
        console.error('Sign up error:', error);
        if (error instanceof Error) {
            authError.set(error.message);
        } else {
            authError.set('An unknown error occurred');
        }
        isLoading.set(false);
        throw error;
    }
}

// Sign out
export async function signOut(): Promise<void> {
    try {
        const auth = getAuth();
        await firebaseSignOut(auth);

        // Auth state listener will update the user store
    } catch (error) {
        console.error('Sign out error:', error);
        if (error instanceof Error) {
            authError.set(error.message);
        } else {
            authError.set('An unknown error occurred');
        }
        throw error;
    }
}

// Mock sign in for testing (use only in development)
export async function mockSignIn(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
        console.warn('Mock sign in is only available in development mode');
        return;
    }

    try {
        // Create a mock user object
        const mockUser = {
            uid: 'test-user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            emailVerified: true,
        } as User;

        // Update the store directly (bypassing Firebase)
        user.set(mockUser);
        isLoading.set(false);

        // Store in localStorage to persist across page reloads
        localStorage.setItem('mockUser', JSON.stringify(mockUser));

    } catch (error) {
        console.error('Mock sign in error:', error);
        if (error instanceof Error) {
            authError.set(error.message);
        } else {
            authError.set('An unknown error occurred');
        }
        throw error;
    }
}

// Check for mock user on initialization in development
export function initMockAuth() {
    if (!browser || process.env.NODE_ENV !== 'development') return;

    const mockUserJson = localStorage.getItem('mockUser');
    if (mockUserJson) {
        try {
            const mockUser = JSON.parse(mockUserJson) as User;
            user.set(mockUser);
        } catch (e) {
            console.error('Error parsing mock user from localStorage', e);
            localStorage.removeItem('mockUser');
        }
    }

    isLoading.set(false);
}