<!-- src/lib/components/ui/Toast.svelte -->
<script lang="ts">
  import { fly } from 'svelte/transition';
  import { toast, type Toast, type ToastType } from '$lib/stores/toastStore';
  
  // Toast Icon components based on type
  const icons = {
    success: `<svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>`,
    error: `<svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>`,
    info: `<svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>`,
    warning: `<svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>`
  };
  
  // Toast background colors based on type
  function getToastClasses(type: ToastType): string {
    const baseClasses = "p-4 rounded-md shadow-lg border-l-4";
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-500`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-500`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-500`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-500`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-500`;
    }
  }
  
  // Close a toast notification
  function dismissToast(id: string) {
    toast.remove(id);
  }
</script>

<div class="toast-container fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-2 px-2">
  {#each $toast as notification (notification.id)}
    <div
      transition:fly={{ x: 100, duration: 300 }}
      class={getToastClasses(notification.type)}
      role="alert"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <!-- Render the appropriate icon based on type -->
          {@html icons[notification.type]}
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium text-gray-900">{notification.message}</p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button
            type="button"
            on:click={() => dismissToast(notification.id)}
            class="inline-flex rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/each}
</div>