<!-- src/routes/+layout.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user, isLoading, initAuth } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  import '../app.postcss'; // Import Tailwind CSS

  // Initialize authentication
  onMount(() => {
    initAuth();
  });
</script>

<svelte:head>
  <title>ContentCal.AI - Social Media Content Calendar</title>
  <meta name="description" content="AI-powered social media content calendar for scheduling and optimizing your posts">
</svelte:head>

{#if $isLoading}
  <div class="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50">
    <slot />
  </div>
{/if}