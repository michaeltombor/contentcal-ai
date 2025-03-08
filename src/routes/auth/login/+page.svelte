<!-- src/routes/auth/login/+page.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { getContext } from 'svelte';
  import { browser } from '$app/environment';
  import type { AuthStore } from '$lib/stores/authStore';
  import { toast } from '$lib/stores/toastStore';
  
  // Form data
  let email = '';
  let password = '';
  let rememberMe = false;
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
  
  // Handle login form submission
  async function handleLogin() {
    if (!email || !password) {
      errorMessage = 'Please enter both email and password';
      return;
    }
    
    errorMessage = '';
    isLoading = true;
    
    try {
      await auth.signIn(email, password);
      toast.success('Successfully logged in!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Friendly error messages for common auth errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else {
        errorMessage = error.message || 'An error occurred during sign in';
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
      await auth.signInWithGoogle();
      toast.success('Successfully logged in with Google!');
      goto(redirectTo);
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      errorMessage = error.message || 'An error occurred during Google sign in';
    } finally {
      isLoading = false;
    }
  }
  
  // Handle password reset
  function handlePasswordReset() {
    goto('/auth/reset-password');
  }
</script>

<svelte:head>
  <title>Login - ContentCal.AI</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md space-y-8">
    <div>
      <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="ContentCal.AI" />
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Or
        <a href="/auth/register" class="font-medium text-primary-600 hover:text-primary-500">
          create a new account
        </a>
      </p>
    </div>
    
    {#if errorMessage}
      <div class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <!-- Error icon -->
            <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              {errorMessage}
            </h3>
          </div>
        </div>
      </div>
    {/if}
    
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
      <div class="-space-y-px rounded-md shadow-sm">
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input 
            id="email-address" 
            name="email" 
            type="email" 
            autocomplete="email" 
            required
            bind:value={email}
            class="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm" 
            placeholder="Email address" 
            disabled={isLoading}
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
            class="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm" 
            placeholder="Password" 
            disabled={isLoading}
          />
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <input 
            id="remember-me" 
            name="remember-me" 
            type="checkbox" 
            bind:checked={rememberMe}
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
            disabled={isLoading}
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-900">
            Remember me
          </label>
        </div>

        <div class="text-sm">
          <button 
            type="button" 
            on:click={handlePasswordReset} 
            class="font-medium text-primary-600 hover:text-primary-500"
            disabled={isLoading}
          >
            Forgot your password?
          </button>
        </div>
      </div>

      <div>
        <button 
          type="submit" 
          class="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
          disabled={isLoading}
        >
          {#if isLoading}
            <span class="absolute inset-y-0 left-0 flex items-center pl-3">
              <!-- Loading spinner -->
              <svg class="h-5 w-5 animate-spin text-primary-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Signing in...
          {:else}
            <span class="absolute inset-y-0 left-0 flex items-center pl-3">
              <!-- Lock icon -->
              <svg class="h-5 w-5 text-primary-500 group-hover:text-primary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
              </svg>
            </span>
            Sign in
          {/if}
        </button>
      </div>
    </form>
    
    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-gray-50 px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div class="mt-6">
        <button 
          type="button" 
          on:click={handleGoogleSignIn} 
          class="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
          disabled={isLoading}
        >
          <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.082z" fill="#4285F4"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  </div>
</div>