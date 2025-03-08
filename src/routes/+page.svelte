<!-- src/routes/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/authStore';
  
  onMount(() => {
    // Redirect to appropriate page based on auth state
    const unsubscribe = user.subscribe(userData => {
      if (userData) {
        goto('/dashboard');
      } else {
        goto('/auth');
      }
    });
    
    return unsubscribe;
  });
</script>

<div class="h-screen flex items-center justify-center bg-gray-50">
  <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
</div>