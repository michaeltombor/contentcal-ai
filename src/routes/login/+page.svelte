<script lang="ts">
  import { signInWithEmail, signInWithGoogle, isAuthenticated } from '$lib/services/authService';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/common/Button.svelte';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let errorMessage = '';
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
      isSubmitting = true;
      
      if (!email || !password) {
        errorMessage = 'Please enter both email and password';
        return;
      }
      
      await signInWithEmail(email, password);
      goto('/calendar');
    } catch (error) {
      console.error('Login error:', error);
      errorMessage = 'Invalid email or password. Please try again.';
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
        Sign in to ContentCal.AI
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Or <a href="/register" class="font-medium text-blue-600 hover:text-blue-500">
          create a new account
        </a>
      </p>
    </div>

    {#if errorMessage}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {errorMessage}
      </div>
    {/if}

    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input
            id="email-address"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
            autocomplete="current-password"
            required
            bind:value={password}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Password"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-900">
            Remember me
          </label>
        </div>

        <div class="text-sm">
          <a href="/forgot-password" class="font-medium text-blue-600 hover:text-blue-500">
            Forgot your password?
          </a>
        </div>
      </div>

      <div>
        <Button
          type="submit"
          variant="primary"
          fullWidth={true}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
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
          Sign in with Google
        </button>
      </div>
    </div>
  </div>
</div>