<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { user, isLoading } from '$lib/stores/authStore';

  onMount(() => {
    // Redirect to calendar if authenticated, otherwise to login
    if (!$isLoading) {
      if ($user) {
        goto('/calendar');
      } else {
        goto('/login');
      }
    }
  });
  
  // Also redirect when auth state changes
  $: if (!$isLoading) {
    if ($user) {
      goto('/calendar');
    } else {
      goto('/login');
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="text-center">
    <h1 class="text-3xl font-extrabold text-gray-900 mb-4">ContentCal.AI</h1>
    <div class="inline-block animate-spin h-8 w-8 border-4 border-gray-200 rounded-full border-t-blue-600 mb-4"></div>
    <p class="text-gray-600">Loading...</p>
  </div>
</div>