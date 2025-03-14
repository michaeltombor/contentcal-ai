<script lang="ts">
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let variant: 'primary' | 'secondary' | 'danger' = 'primary';
  export let disabled = false;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let fullWidth = false;
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  const disabledClass = 'opacity-50 cursor-not-allowed';
  
  const classes = `
    inline-flex justify-center rounded-md border border-transparent
    font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabled ? disabledClass : ''}
    ${fullWidth ? 'w-full' : ''}
  `;
</script>

<button {type} {disabled} class={classes} on:click>
  <slot></slot>
</button>