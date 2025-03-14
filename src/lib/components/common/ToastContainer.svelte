<!-- src/lib/components/common/ToastContainer.svelte -->
<script lang="ts">
  import { toastStore } from '$lib/stores/toastStore';
  import Toast from './Toast.svelte';
  
  export let position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' = 'top-right';
  
  // Handle position classes
  $: positionClass = getPositionClass(position);
  
  function getPositionClass(pos: string): string {
    switch(pos) {
      case 'top-left': return 'top-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      case 'top-right':
      default: return 'top-4 right-4';
    }
  }
  
  function handleClose(id: string) {
    toastStore.remove(id);
  }
</script>

<div class="toast-container fixed z-50 m-0 p-4 w-80 max-w-full {positionClass}">
  {#each $toastStore as toast (toast.id)}
    <Toast 
      id={toast.id}
      message={toast.message}
      type={toast.type}
      onClose={handleClose}
    />
  {/each}
</div>

<style>
  .toast-container {
    pointer-events: none;
  }
  
  :global(.toast-item) {
    pointer-events: auto;
  }
</style>