<!-- src/lib/components/layout/Header.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { getContext } from 'svelte';
  import { goto } from '$app/navigation';
  import type { AuthStore } from '$lib/stores/authStore';
  import { toastStore } from '$lib/stores/toastStore';
  
  export let isLoggedIn = false;
  
  // Get auth from context
  const auth = getContext<AuthStore>('auth');
  
  // Navigation items
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', protected: true },
    { name: 'Calendar', href: '/calendar', protected: true },
    { name: 'Analytics', href: '/analytics', protected: true },
    { name: 'Pricing', href: '/pricing', protected: false },
    { name: 'About', href: '/about', protected: false }
  ];
  
  // Filter nav items based on auth status
  $: filteredNavItems = navItems.filter(item => !item.protected || isLoggedIn);
  
  // Mobile menu state
  let isMobileMenuOpen = false;
  
  // User menu state
  let isUserMenuOpen = false;
  
  // Toggle mobile menu
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }
  
  // Toggle user menu
  function toggleUserMenu() {
    isUserMenuOpen = !isUserMenuOpen;
  }
  
  // Close all menus
  function closeMenus() {
    isMobileMenuOpen = false;
    isUserMenuOpen = false;
  }
  
  // Handle sign out
  async function handleSignOut() {
    try {
      await auth.signOut();
      toastStore.success('Successfully signed out');
      goto('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toastStore.error('Failed to sign out');
    }
  }
</script>

<header class="bg-white shadow-sm">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 justify-between">
      <div class="flex">
        <div class="flex flex-shrink-0 items-center">
          <a href="/" class="flex items-center">
            <img class="h-8 w-auto" src="images/logo.svg" alt="ContentCal.AI" />
            <span class="ml-2 text-xl font-bold text-gray-900">ContentCal.AI</span>
          </a>
        </div>
        
        <!-- Desktop navigation -->
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          {#each filteredNavItems as item}
            <a
              href={item.href}
              class="inline-flex items-center px-1 pt-1 text-sm font-medium"
              class:border-b-2={$page.url.pathname === item.href}
              class:border-primary-500={$page.url.pathname === item.href}
              class:text-gray-900={$page.url.pathname === item.href}
              class:text-gray-500={$page.url.pathname !== item.href}
              class:hover:border-gray-300={$page.url.pathname !== item.href}
              class:hover:text-gray-700={$page.url.pathname !== item.href}
            >
              {item.name}
            </a>
          {/each}
        </div>
      </div>
      
      <div class="flex items-center">
        {#if isLoggedIn}
          <!-- User dropdown menu -->
          <div class="ml-3 relative">
            <div>
              <button
                type="button"
                class="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                id="user-menu-button"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                on:click={toggleUserMenu}
              >
                <span class="sr-only">Open user menu</span>
                {#if $auth?.user?.photoURL}
                  <img class="h-8 w-8 rounded-full" src={$auth.user.photoURL} alt="User avatar" />
                {:else}
                  <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-semibold">
                    {$auth?.user?.displayName ? $auth.user.displayName.charAt(0).toUpperCase() : $auth?.user?.email?.charAt(0).toUpperCase()}
                  </div>
                {/if}
              </button>
            </div>
            
            {#if isUserMenuOpen}
              <div
                class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabindex="-1"
              >
                <div class="px-4 py-2 border-b border-gray-100">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {$auth?.user?.displayName || 'User'}
                  </p>
                  <p class="text-xs text-gray-500 truncate">
                    {$auth?.user?.email}
                  </p>
                </div>
                <a
                  href="/account/profile"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabindex="-1"
                  on:click={closeMenus}
                >
                  Your Profile
                </a>
                <a
                  href="/account/settings"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabindex="-1"
                  on:click={closeMenus}
                >
                  Settings
                </a>
                <button
                  type="button"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabindex="-1"
                  on:click={handleSignOut}
                >
                  Sign out
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <div class="flex space-x-4">
            <a
              href="/auth/login"
              class="inline-flex items-center rounded-md border border-transparent bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Sign in
            </a>
            <a
              href="/auth/register"
              class="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Sign up
            </a>
          </div>
        {/if}
        
        <!-- Mobile menu button -->
        <div class="flex items-center sm:hidden ml-4">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            aria-expanded={isMobileMenuOpen}
            on:click={toggleMobileMenu}
          >
            <span class="sr-only">Open main menu</span>
            {#if isMobileMenuOpen}
              <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {:else}
              <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Mobile menu -->
  {#if isMobileMenuOpen}
    <div class="sm:hidden">
      <div class="space-y-1 pt-2 pb-3">
        {#each filteredNavItems as item}
          <a
            href={item.href}
            class="block py-2 pl-3 pr-4 text-base font-medium"
            class:bg-primary-50={$page.url.pathname === item.href}
            class:border-l-4={$page.url.pathname === item.href}
            class:border-primary-500={$page.url.pathname === item.href}
            class:text-primary-700={$page.url.pathname === item.href}
            class:text-gray-500={$page.url.pathname !== item.href}
            class:hover:bg-gray-50={$page.url.pathname !== item.href}
            class:hover:text-gray-700={$page.url.pathname !== item.href}
            on:click={closeMenus}
          >
            {item.name}
          </a>
        {/each}
      </div>
    </div>
  {/if}
</header>