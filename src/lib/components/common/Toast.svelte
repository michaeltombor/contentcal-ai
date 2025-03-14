<!-- src/lib/components/common/Toast.svelte -->
<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { ToastType } from '$lib/stores/toastStore';
  
  export let id: string;
  export let message: string;
  export let type: ToastType;
  export let onClose: (id: string) => void;
  
  // Handle icon based on type
  $: icon = getIcon(type);
  
  function getIcon(type: ToastType): string {
    switch(type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': 
      default: return 'info';
    }
  }
  
  // Handle background color based on type
  $: bgColor = getBgColor(type);
  
  function getBgColor(type: ToastType): string {
    switch(type) {
      case 'success': return 'bg-green-100 border-green-500 text-green-800';
      case 'error': return 'bg-red-100 border-red-500 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'info': 
      default: return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  }
  
  // Handle icon color based on type
  $: iconColor = getIconColor(type);
  
  function getIconColor(type: ToastType): string {
    switch(type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': 
      default: return 'text-blue-500';
    }
  }
</script>

<div
  class="toast-item flex items-center p-4 mb-3 rounded-md shadow-md border-l-4 {bgColor}"
  in:fly={{ y: 20, duration: 300, easing: quintOut }}
  out:fade={{ duration: 200 }}
>
  <span class="material-icons {iconColor} mr-3">{icon}</span>
  <div class="flex-grow">{message}</div>
  <button class="ml-2 text-gray-500 hover:text-gray-700" on:click={() => onClose(id)}>
    <span class="material-icons text-sm">close</span>
  </button>
</div>