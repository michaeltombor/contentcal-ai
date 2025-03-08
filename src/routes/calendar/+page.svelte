<!-- src/routes/calendar/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Calendar from './components/Calendar.svelte';
  import PostCreateModal from './components/PostCreateModal.svelte';
  import { browser } from '$app/environment';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import { navigateToToday } from '$lib/stores/calendarStore';
  
  let isCreateModalOpen = false;
  let initialDate = new Date();
  let isAuthenticated = false;
  let isLoading = true;
  
  onMount(() => {
    if (browser) {
      const auth = getAuth();
      
      // Check authentication status
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        isAuthenticated = !!user;
        isLoading = false;
      });
      
      // Set today as default when the component mounts
      navigateToToday();
      
      return unsubscribe;
    }
  });
  
  function openCreateModal(date: Date = new Date()) {
    initialDate = date;
    isCreateModalOpen = true;
  }
  
  function closeCreateModal() {
    isCreateModalOpen = false;
  }
</script>

<svelte:head>
  <title>Content Calendar | ContentCal.AI</title>
  <meta name="description" content="Plan, schedule, and manage your social media posts with ContentCal.AI's intelligent content calendar." />
</svelte:head>

<!-- Main Calendar Container -->
<div class="h-screen flex flex-col bg-gray-50">
  {#if isLoading}
    <!-- Loading state -->
    <div class="flex-1 flex items-center justify-center">
      <div class="inline-block animate-spin h-8 w-8 border-4 border-gray-200 rounded-full border-t-blue-600"></div>
    </div>
  {:else if !isAuthenticated}
    <!-- Authentication required message -->
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center p-8 max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h2 class="text-xl font-medium mt-4">Authentication Required</h2>
        <p class="text-gray-600 mt-2">Please sign in to access your content calendar.</p>
        <a href="/login" class="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Sign In
        </a>
      </div>
    </div>
  {:else}
    <!-- Calendar Component -->
    <div class="flex-1 overflow-hidden">
      <Calendar {openCreateModal} />
    </div>
  {/if}
  
  <!-- Post Creation Modal -->
  <PostCreateModal 
    isOpen={isCreateModalOpen} 
    {initialDate}
    on:close={closeCreateModal}
  />
</div>