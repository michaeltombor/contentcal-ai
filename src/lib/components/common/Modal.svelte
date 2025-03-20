<!-- src/lib/components/common/Modal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  export let closeOnEscape = true;
  export let closeOnOutsideClick = true;
  
  const dispatch = createEventDispatcher();
  
  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (closeOnEscape && event.key === 'Escape') {
      dispatch('close');
    }
  }
  
  // Handle clicks outside modal content
  function handleOutsideClick(event: MouseEvent) {
    if (closeOnOutsideClick && event.target === event.currentTarget) {
      dispatch('close');
    }
  }
  
  // Add/remove event listeners
  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    document.body.classList.add('overflow-hidden'); // Prevent scrolling when modal is open
  });
  
  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown);
    document.body.classList.remove('overflow-hidden');
  });
</script>

<!-- Modal overlay -->
<div 
  class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
  on:click={handleOutsideClick}
  transition:fade={{ duration: 200 }}
>
  <!-- Modal content -->
  <div 
    class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
    transition:scale={{ start: 0.95, duration: 200 }}
    on:click|stopPropagation
  >
    <!-- Close button -->
    <button 
      class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      on:click={() => dispatch('close')}
      aria-label="Close modal"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
    
    <!-- Modal content from slot -->
    <div class="p-6">
      <slot></slot>
    </div>
  </div>
</div>