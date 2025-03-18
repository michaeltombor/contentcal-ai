<!-- src/routes/calendar/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    calendarViewState, 
    filteredEvents 
  } from '$lib/stores/calendarStore';
  import { 
    postStore,
    postStoreLoading
  } from '$lib/stores/postStore';
  import { authStore } from '$lib/stores/authStore';
  import Button from '$lib/components/common/Button.svelte';
  import Modal from '$lib/components/common/Modal.svelte';
  import Calendar from './components/Calendar.svelte';
  import PostCreateModal from './components/PostCreateModal.svelte';
  import ToastContainer from '$lib/components/common/ToastContainer.svelte';
  
  let showCreatePostModal = false;
  let selectedDate: Date = new Date();
  
  // Store subscriptions
  $: user = $authStore.user;
  $: isLoading = $postStore.loading;
  $: error = $postStore.error;
  
  // Handle opening the create post modal
  function openCreateModal(date?: Date) {
    selectedDate = date || new Date();
    showCreatePostModal = true;
  }
  
  // Handle post creation
  async function handlePostCreated(event: CustomEvent<any>) {
    const newPost = event.detail;
    
    try {
      await postStore.addPost(newPost);
      showCreatePostModal = false;
      // Toast is handled in the store
    } catch (error) {
      console.error('Failed to create post:', error);
      // Error toast is handled in the store
    }
  }
  
  // Initialize on mount
  onMount(() => {
    // Load posts if not already loaded
    if (!$postStore.loading && $postStore.posts.length === 0) {
      postStore.loadPosts();
    }
  });
</script>

<div class="h-screen flex flex-col bg-gray-50">
  <!-- Main Calendar Component - now includes its own header -->
  <div class="flex-1 overflow-hidden">
    <Calendar {openCreateModal} />
  </div>
  
  <!-- Toast Container -->
  <ToastContainer position="top-right" />
  
  <!-- Loading State -->
  {#if isLoading}
    <div class="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50">
      <div class="spinner"></div>
    </div>
  {/if}
  
  <!-- Error State -->
  {#if error}
    <div class="fixed bottom-4 right-4 bg-red-100 text-red-700 p-3 rounded-md shadow-md z-50">
      {error}
    </div>
  {/if}
</div>

<!-- Create Post Modal -->
<Modal 
  title="Create New Post" 
  bind:open={showCreatePostModal} 
  on:close={() => showCreatePostModal = false}
>
  <PostCreateModal 
    initialDate={selectedDate}
    on:submit={handlePostCreated}
    on:cancel={() => showCreatePostModal = false} 
  />
</Modal>

<style>
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>