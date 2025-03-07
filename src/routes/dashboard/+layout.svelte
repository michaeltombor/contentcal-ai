<!-- src/routes/dashboard/+layout.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user, signOut } from '$lib/stores/authStore';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  // Auth guard - redirect to login if not authenticated
  onMount(() => {
    const unsubscribe = user.subscribe(userData => {
      if (!userData) {
        goto('/auth');
      }
    });
    
    return unsubscribe;
  });

  async function handleSignOut() {
    const result = await signOut();
    if (result.success) {
      goto('/auth');
    }
  }

  // Navigation items
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Calendar', href: '/dashboard/calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'Create Post', href: '/dashboard/create', icon: 'M12 4v16m8-8H4' },
    { name: 'My Posts', href: '/dashboard/posts', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Recommendations', href: '/dashboard/recommendations', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  $: isActive = (href) => $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
</script>

<div class="flex h-screen overflow-hidden bg-gray-100">
  <!-- Sidebar -->
  <div class="hidden md:flex md:flex-shrink-0">
    <div class="flex flex-col w-64">
      <div class="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-indigo-700">
        <div class="flex items-center flex-shrink-0 px-4">
          <span class="text-xl font-bold text-white">ContentCal.AI</span>
        </div>
        <div class="mt-5 flex-1 flex flex-col">
          <nav class="flex-1 px-2 space-y-1">
            {#each navItems as item}
              <a 
                href={item.href} 
                class="group flex items-center px-2 py-2 text-sm font-medium rounded-md {isActive(item.href) ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600'}"
              >
                <svg 
                  class="mr-3 flex-shrink-0 h-6 w-6 {isActive(item.href) ? 'text-indigo-200' : 'text-indigo-300'}" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
                </svg>
                {item.name}
              </a>
            {/each}
          </nav>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Mobile menu button -->
  <div class="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center h-16 bg-indigo-700 px-4">
    <button type="button" class="text-white focus:outline-none">
      <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
    <div class="ml-4 text-xl font-bold text-white">ContentCal.AI</div>
  </div>
  
  <!-- Main content -->
  <div class="flex flex-col flex-1 overflow-hidden">
    <!-- Top header -->
    <div class="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <div class="flex-1 px-4 flex justify-end">
        <div class="ml-4 flex items-center md:ml-6">
          {#if $user}
            <div class="flex items-center">
              <span class="hidden md:block text-sm text-gray-700 mr-2">
                {$user.displayName || $user.email}
              </span>
              <div class="relative">
                <button 
                  class="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {#if $user.photoURL}
                    <img class="h-8 w-8 rounded-full" src={$user.photoURL} alt="" />
                  {:else}
                    <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span class="text-indigo-800 font-medium">
                        {($user.displayName || $user.email || '').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  {/if}
                </button>
                
                <!-- Profile dropdown -->
                <div class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 hidden">
                  <button 
                    on:click={handleSignOut}
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <main class="flex-1 relative overflow-y-auto focus:outline-none pt-6 md:pt-0">
      <slot></slot>
    </main>
  </div>
</div>