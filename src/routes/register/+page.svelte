<script lang="ts">
  import { registerWithEmail, signInWithGoogle, isAuthenticated } from '$lib/services/authService';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/Button.svelte';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let displayName = '';
  let errorMessage = '';
  let successMessage = '';
  let isSubmitting = false;

  onMount(() => {
    // Redirect to calendar if already authenticated
    const unsubscribe = isAuthenticated.subscribe(value => {
      if (value) {
        goto('/calendar');
      }
    });

    return unsubscribe;
  });

  async function handleSubmit() {
    try {
      errorMessage = '';
      successMessage = '';
      isSubmitting = true;
      
      // Validate inputs
      if (!email || !password || !confirmPassword || !displayName) {
        errorMessage = 'Please fill in all fields';
        return;
      }
      
      if (password !== confirmPassword) {
        errorMessage = 'Passwords do not match';
        return;
      }
      
      if (password.length < 6) {
        errorMessage = 'Password must be at least 6 characters long';
        return;
      }
      
      // Register user
      await registerWithEmail(email, password, displayName);
      
      // Show success message
      successMessage = 'Registration successful! Please check your email to verify your account.';
      
      // Reset form
      email = '';
      password = '';
      confirmPassword = '';
      displayName = '';
      
      // Redirect after a delay
      setTimeout(() => {
        goto('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Registration error:', error);
      errorMessage = 'Error creating account. This email may already be in use.';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleGoogleSignIn() {
    try {
      errorMessage = '';
      isSubmitting = true;
      await signInWithGoogle();
      goto('/calendar');
    } catch (error) {
      console.error('Google sign-in error:', error);
      errorMessage = 'Error signing in with Google. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Or <a href="/login" class="font-medium text-blue-600 hover:text-blue-500">
          sign in to your existing account
        </a>
      </p>
    </div>

    {#if errorMessage}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {errorMessage}
      </div>
    {/if}

    {#if successMessage}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
        {successMessage}
      </div>
    {/if}

    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="display-name" class="sr-only">Display name</label>
          <input
            id="display-name"
            name="displayName"
            type="text"
            required
            bind:value={displayName}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Display name"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input
            id="email-address"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="new-password"
            required
            bind:value={password}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Password"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label for="confirm-password" class="sr-only">Confirm password</label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            bind:value={confirmPassword}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Confirm password"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Button
          type="submit"
          variant="primary"
          fullWidth={true}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </div>
    </form>

    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-gray-50 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div class="mt-6">
        <button
          type="button"
          class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          on:click={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          <img
            class="h-5 w-5 mr-2"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google logo"
          />
          Sign up with Google
        </button>
      </div>
    </div>
  </div>
</div>