<!-- src/lib/components/ui/LoadingSpinner.svelte -->
<script lang="ts">
  export let size = 'md'; // 'sm', 'md', 'lg', 'xl'
  export let color = 'primary'; // 'primary', 'white', 'gray', etc.
  
  // Map size to classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  // Map color to classes
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    black: 'text-black'
  };
  
  $: spinnerClasses = `${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.primary} animate-spin`;
</script>

<svg class={spinnerClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-label="Loading">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>