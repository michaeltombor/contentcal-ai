<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { navigating } from '$app/stores';
  import { isAuthenticated } from '$lib/stores/authStore';
  import { setContext } from 'svelte';
  import { browser } from '$app/environment';
  import '../app.css'; // TailwindCSS import
  
  // Import your app components
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  
  export let data;
  
  // Set auth context for child components
  setContext('auth', data.auth);
  
  // Derive authentication state
  $: isLoggedIn = browser ? isAuthenticated(data.auth) : false;
  
  // Track loading state for navigation
  $: loading = $navigating?.state === 'loading';
  
  // Check if current route requires authentication
  $: authRequired = $page.route.id?.startsWith('/(protected)') || false;
  
  // Redirect to login if not authenticated on protected routes
  $: if (browser && authRequired && !$isLoggedIn && !data?.auth?.loading) {
    console.log('Access denied: redirecting to login');
    window.location.href = '/auth/login?redirect=' + encodeURIComponent($page.url.pathname);
  }
</script>

{#if data?.auth?.loading}
  <div class="flex h-screen items-center justify-center">
    <LoadingSpinner />
  </div>
{:else}
  <div class="flex min-h-screen flex-col">
    <Header {isLoggedIn} />
    
    <main class="flex-grow">
      {#if loading}
        <div class="fixed top-0 left-0 w-full h-1 bg-primary-500 animate-pulse"></div>
      {/if}
      
      <slot />
    </main>
    
    <Footer />
  </div>
  
  <!-- Toast notification system -->
  <Toast />
{/if}