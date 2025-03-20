<!-- src/routes/calendar/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Calendar from './components/Calendar.svelte';
  import PostCreateModal from './components/PostCreateModal.svelte';
  import ToastContainer from '$lib/components/common/ToastContainer.svelte';
  import { getFirebaseAuth } from '$lib/firebase/firebase';
  import { authStore } from '$lib/stores/authStore';
  import { postStore } from '$lib/stores/postStore';
  import { goto } from '$app/navigation';
  
  // State for controlling modal visibility
  let showCreateModal = false;
  let selectedDate: Date | null = null;
  let editingPost: any = null; // Replace with proper Post type
  
  onMount(() => {
    // Initialize Firebase Auth
    const auth = getFirebaseAuth();
    
    // Check authentication
    if (!$authStore.user) {
      goto('/login');
    }
    
    // Initialize post data
    if ($authStore.user?.uid) {
      postStore.loadUserPosts($authStore.user.uid);
    }
  });
  
  // Function to open create modal with selected date
  function openCreateModal(date?: Date) {
    selectedDate = date || new Date();
    editingPost = null;
    showCreateModal = true;
  }
  
  // Function to open edit modal with existing post
  function openEditModal(post: any) { // Replace with proper Post type
    selectedDate = new Date(post.scheduledDate);
    editingPost = post;
    showCreateModal = true;
  }
  
  // Function to close modal
  function closeModal() {
    showCreateModal = false;
  }
  
  // Handle post save/update
  function handlePostSave() {
    closeModal();
    // Refresh calendar data if needed
  }
</script>

<svelte:head>
  <title>ContentCal.AI - Calendar</title>
</svelte:head>

<div class="calendar-container">
  <Calendar {openCreateModal} />
  
  <!-- Post Create/Edit Modal -->
  {#if showCreateModal}
    <PostCreateModal
      {selectedDate}
      post={editingPost}
      on:close={closeModal}
      on:save={handlePostSave}
    />
  {/if}
  
  <ToastContainer />
</div>

<style lang="postcss">
  .calendar-container {
    @apply w-full h-full flex flex-col;
  }
</style>