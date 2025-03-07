<!-- src/routes/auth/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { signIn, signUp, resetPassword, user } from '$lib/stores/authStore';
  
  let email = '';
  let password = '';
  let confirmPassword = '';
  let displayName = '';
  let mode = 'login'; // login, register, or reset
  let loading = false;
  let error = '';
  let success = '';
  
  onMount(() => {
    // Redirect if already logged in
    const unsubscribe = user.subscribe(userData => {
      if (userData) {
        goto('/dashboard');
      }
    });
    
    return unsubscribe;
  });
  
  async function handleSubmit() {
    error = '';
    success = '';
    loading = true;
    
    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (!result.success) {
          error = result.error;
        } else {
          goto('/dashboard');
        }
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          error = 'Passwords do not match';
          loading = false;
          return;
        }
        
        const result = await signUp(email, password, displayName);
        if (!result.success) {
          error = result.error;
        } else {
          goto('/dashboard');
        }
      } else if (mode === 'reset') {
        const result = await resetPassword(email);
        if (!result.success) {
          error = result.error;
        } else {
          success = 'Password reset email sent. Please check your inbox.';
          setTimeout(() => {
            mode = 'login';
          }, 3000);
        }
      }
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
  
  function switchMode(newMode) {
    error = '';
    success = '';
    mode = newMode;
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {#if mode === 'login'}
          Sign in to ContentCal.AI
        {:else if mode === 'register'}
          Create your account
        {:else}
          Reset your password
        {/if}
      </h2>
    </div>
    
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      <div class="rounded-md shadow-sm -space-y-px">
        {#if mode === 'register'}
          <div>
            <label for="displayName" class="sr-only">Display Name</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              bind:value={displayName}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Display Name"
            />
          </div>
        {/if}
        
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input
            id="email-address"
            name="email"
            type="email"
            autocomplete="email"
            required
            bind:value={email}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 {mode === 'register' ? '' : 'rounded-t-md'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        
        {#if mode !== 'reset'}
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              bind:value={password}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 {mode === 'register' && confirmPassword ? '' : 'rounded-b-md'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        {/if}
        
        {#if mode === 'register'}
          <div>
            <label for="confirm-password" class="sr-only">Confirm Password</label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autocomplete="new-password"
              required
              bind:value={confirmPassword}
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirm Password"
            />
          </div>
        {/if}
      </div>
      
      {#if error}
        <div class="text-red-500 text-sm">{error}</div>
      {/if}
      
      {#if success}
        <div class="text-green-500 text-sm">{success}</div>
      {/if}
      
      <div>
        <button
          type="submit"
          disabled={loading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 {loading ? 'opacity-70 cursor-not-allowed' : ''}"
        >
          {#if loading}
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <!-- Loading spinner -->
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            Processing...
          {:else if mode === 'login'}
            Sign in
          {:else if mode === 'register'}
            Sign up
          {:else}
            Send reset link
          {/if}
        </button>
      </div>
      
      <div class="flex items-center justify-between">
        {#if mode === 'login'}
          <div class="text-sm">
            <button 
              type="button" 
              class="font-medium text-indigo-600 hover:text-indigo-500"
              on:click={() => switchMode('reset')}
            >
              Forgot your password?
            </button>
          </div>
          <div class="text-sm">
            <button 
              type="button" 
              class="font-medium text-indigo-600 hover:text-indigo-500"
              on:click={() => switchMode('register')}
            >
              Don't have an account?
            </button>
          </div>
        {:else}
          <div class="text-sm">
            <button 
              type="button" 
              class="font-medium text-indigo-600 hover:text-indigo-500"
              on:click={() => switchMode('login')}
            >
              Back to login
            </button>
          </div>
        {/if}
      </div>
    </form>
  </div>
</div>