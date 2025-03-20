<!-- src/lib/components/common/Button.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let fullWidth = false;
  export let loading = false;
  export let icon = '';
  
  // Classes based on props
  $: variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  };
  
  $: sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };
  
  // Combined classes
  $: classes = `
    font-medium rounded transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${fullWidth ? 'w-full' : ''}
    ${$$props.class || ''}
  `;
  
  // Event dispatcher
  const dispatch = createEventDispatcher();
  
  function handleClick(event: MouseEvent) {
    if (!disabled && !loading) {
      dispatch('click', event);
    }
  }
</script>

<button
  {type}
  class={classes}
  disabled={disabled || loading}
  on:click={handleClick}
  {...$$restProps}
>
  {#if loading}
    <span class="inline-block mr-2 animate-spin">◌</span>
  {/if}
  
  {#if icon}
    <span class="mr-2">{icon}</span>
  {/if}
  
  <slot></slot>
</button>