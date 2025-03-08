<!-- src/routes/auth/reset-password/+page.svelte -->
<script lang="ts">
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import type { AuthStore } from '$lib/stores/authStore';
  import { toast } from '$lib/stores/toastStore';
  
  // Form data
  let email = '';
  let isLoading = false;
  let errorMessage = '';
  let isResetEmailSent = false;
  
  // Get auth from context
  const auth = getContext<AuthStore>('auth');
  
  // Handle password reset
  async function handlePasswordReset() {
    if (!email) {
      errorMessage = 'Please enter your email address';
      return;
    }
    
    errorMessage = '';
    isLoading = true;
    
    try {
      await auth.resetPassword(email);
      isResetEmailSent = true;
      toast.success('Password reset email sent!');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        // For security reasons, don't tell the user that the email doesn't exist
        // Instead, pretend we sent the email
        isResetEmailSent = true;
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/missing-email') {
        errorMessage = 'Please enter your email address';
      } else {
        errorMessage = error.message || 'An error occurred during password reset';
      }
    } finally {
      isLoading = false;
    }
  }
  
  // Return to login page
  function goToLogin() {
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>Reset Password - ContentCal.AI</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
  <div class="w-full max-w-md space-y-8">
    <div>
      <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="ContentCal.AI" />
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Reset your password
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Or
        <button 
          type="button"
          on:click={goToLogin}
          class="font-medium text-primary-600 hover:text-primary-500"
        >
          return to sign in
        </button>
      </p>
    </div>
    
    {#if isResetEmailSent}
      <div class="rounded-md bg-green-50 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">
              Password reset email sent
            </h3>
            <div class="mt-2 text-sm text-green-700">
              <p>
                We've sent you an email with a link to reset your password. 
                Please check your inbox (and spam folder) and follow the instructions.
              </p>
            </div>
            <div class="mt-4">
              <button
                type="button"
                on:click={goToLogin}
                class="inline-flex items-center rounded-md border border-transparent bg-green-100 px-3 py-2 text-sm font-medium leading-4 text-green-700 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Return to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    {:else}
      {#if errorMessage}
        <div class="rounded-md bg-red-50 p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
      
      <form class="mt-8 space-y-6" on:submit|preventDefault={handlePasswordReset}>
        <div>
          <label for="email-address" class="block text-sm font-medium text-gray-700">Email address</label>
          <input 
            id="email-address" 
            name="email" 
            type="email" 
            autocomplete="email" 
            required
            bind:value={email}
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm" 
            placeholder="Enter your email address" 
            disabled={isLoading}
          />
        </div>
        
        <div>
          <p class="text-sm text-gray-600">
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>
        </div>

        <div>
          <button 
            type="submit" 
            class="group relative flex w-full justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-70"
            disabled={isLoading || !email}
          >
            {#if isLoading}
              <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg class="h-5 w-5 animate-spin text-primary-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Sending reset email...
            {:else}
              <span class="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg class="h-5 w-5 text-primary-500 group-hover:text-primary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              Send reset email
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>