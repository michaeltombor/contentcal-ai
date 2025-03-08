<!-- src/routes/auth/register/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getContext } from 'svelte';
  import { browser } from '$app/environment';
  import type { AuthStore } from '$lib/stores/authStore';
  import { toast } from '$lib/stores/toastStore';
  import { doc, setDoc } from 'firebase/firestore';
  import { getFirebaseFirestore } from '$lib/firebase/firebase';
  
  // Form data
  let email = '';
  let password = '';
  let confirmPassword = '';
  let displayName = '';
  let agreeToTerms = false;
  let isLoading = false;
  let errorMessage = '';
  
  // Get auth from context
  const auth = getContext<AuthStore>('auth');
  
  // Get redirect URL from query parameters
  $: redirectTo = $page.url.searchParams.get('redirect') || '/dashboard';
  
  // Check if user is already logged in
  $: if (browser && $auth?.user) {
    goto(redirectTo);
  }
  
  // Password validation
  $: passwordsMatch = password === confirmPassword;
  $: passwordStrength = validatePasswordStrength(password);
  $: isPasswordValid = password.length >= 8 && passwordStrength >= 2;
  
  // Form validation
  $: isFormValid = email && 
                   isPasswordValid && 
                   passwordsMatch && 
                   displayName && 
                   agreeToTerms;
  
  function validatePasswordStrength(password: string): number {
    if (!password) return 0;
    
    let strength = 0;
    
    // Check for various character types
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 4);
  }
  
  // Handle registration form submission
  async function handleRegister() {
    if (!isFormValid) {
      if (!passwordsMatch) {
        errorMessage = 'Passwords do not match';
      } else if (!isPasswordValid) {
        errorMessage = 'Password must be at least 8 characters and contain a mix of character types';
      } else if (!agreeToTerms) {
        errorMessage = 'You must agree to the terms and conditions';
      } else {
        errorMessage = 'Please fill in all required fields';
      }
      return;
    }
    
    errorMessage = '';
    isLoading = true;
    
    try {
      // Create user with Firebase Auth
      const userCredential = await auth.signUp(email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await auth.updateUserProfile(displayName);
      
      // Create user document in Firestore
      const db = getFirebaseFirestore();
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        createdAt: new Date(),
        role: 'user',
        planTier: 'free',
        isActive: true
      });
      
      toast.success('Account created successfully!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Friendly error messages for common auth errors
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password';
      } else {
        errorMessage = error.message || 'An error occurred during registration';
      }
    } finally {
      isLoading = false;
    }
  }
  
  // Handle Google sign-in
  async function handleGoogleSignIn() {
    isLoading = true;
    errorMessage = '';
    
    try {
      const userCredential = await auth.signInWithGoogle();
      const user = userCredential.user;
      
      // Check if this is a new user
      const isNewUser = userCredential.additionalUserInfo?.isNewUser;
      
      if (isNewUser) {
        // Create user document in Firestore for new Google users
        const db = getFirebaseFirestore();
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
          role: 'user',
          planTier: 'free',
          isActive: true,
          authProvider: 'google'
        });
        
        toast.success('Account created successfully with Google!');
      } else {
        toast.success('Successfully signed in with Google!');
      }
      
      goto(redirectTo);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      errorMessage = error.message || 'An error occurred during Google sign in';
    } finally {
      isLoading = false;
    }
  }