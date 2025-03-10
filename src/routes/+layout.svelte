<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { app } from '$lib/firebase/config';
  import { initAuth, initMockAuth } from '$lib/stores/authStore';
  import Toast from '$lib/components/Toast.svelte';
  import '../app.css';
  
  let unsubscribeAuth: (() => void) | undefined;
  
  onMount(() => {
    if (browser) {
      console.log('Firebase initialized:', app.name);
      
      // Initialize authentication
      unsubscribeAuth = initAuth();
      
      // Check for mock auth in development
      if (process.env.NODE_ENV === 'development') {
        initMockAuth();
      }
    }
    
    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    };
  });
</script>

<!-- Toast notifications -->
<Toast />

<!-- Page content -->
<slot />