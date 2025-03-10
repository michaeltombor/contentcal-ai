<!-- src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100">
  <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
    <h1 class="text-2xl font-bold text-red-600 mb-4">Error {$page.status}</h1>
    <p class="text-gray-700 mb-6">{$page.error?.message || 'An unexpected error occurred'}</p>
    <a href="/" class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
      Go to Home
    </a>
  </div>
</div>