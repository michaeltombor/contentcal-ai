<!-- src/routes/calendar/components/CalendarSidebar.svelte -->
<script lang="ts">
  import { calendarViewState } from '$lib/stores/calendarStore';
  import type { PlatformType, PostStatus } from '$lib/types/calendar';
  import { writable } from 'svelte/store';
  
  // Create a local filter store for now (until we fix the imports)
  const filters = writable({
    platforms: ['twitter', 'instagram', 'facebook', 'linkedin'] as PlatformType[],
    status: ['draft', 'scheduled', 'published', 'failed'] as PostStatus[],
    searchTerm: ''
  });
  
  // Platform options
  const platformOptions: { id: PlatformType; label: string; color: string }[] = [
    { id: 'twitter', label: 'Twitter', color: '#1DA1F2' },
    { id: 'instagram', label: 'Instagram', color: '#E1306C' },
    { id: 'facebook', label: 'Facebook', color: '#4267B2' },
    { id: 'linkedin', label: 'LinkedIn', color: '#0077B5' }
  ];
  
  // Status options
  const statusOptions: { id: PostStatus; label: string; color: string }[] = [
    { id: 'draft', label: 'Draft', color: '#9CA3AF' },
    { id: 'scheduled', label: 'Scheduled', color: '#60A5FA' },
    { id: 'published', label: 'Published', color: '#34D399' },
    { id: 'failed', label: 'Failed', color: '#F87171' }
  ];
  
  // Handle platform filter changes
  function handlePlatformFilterChange(platform: PlatformType) {
    // Toggle the platform in the filter
    filters.update(state => {
      if (state.platforms.includes(platform)) {
        // Remove the platform
        return {
          ...state,
          platforms: state.platforms.filter(p => p !== platform)
        };
      } else {
        // Add the platform
        return {
          ...state,
          platforms: [...state.platforms, platform]
        };
      }
    });
  }
  
  // Handle status filter changes
  function handleStatusFilterChange(status: PostStatus) {
    // Toggle the status in the filter
    filters.update(state => {
      if (state.status.includes(status)) {
        // Remove the status
        return {
          ...state,
          status: state.status.filter(s => s !== status)
        };
      } else {
        // Add the status
        return {
          ...state,
          status: [...state.status, status]
        };
      }
    });
  }
  
  // Reset filters
  function resetFilters() {
    filters.set({
      platforms: ['twitter', 'instagram', 'facebook', 'linkedin'],
      status: ['draft', 'scheduled', 'published', 'failed'],
      searchTerm: ''
    });
  }
  
  // Handle search input
  function handleSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    filters.update(state => ({
      ...state,
      searchTerm: input.value
    }));
  }
</script>

<div class="w-64 border-r bg-white overflow-auto flex-shrink-0 h-full">
  <div class="p-4">
    <div class="mb-4">
      <h3 class="font-medium text-gray-900 mb-2">Platforms</h3>
      <div class="space-y-2">
        {#each platformOptions as platform}
          <label class="flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              class="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
              checked={$filters.platforms.includes(platform.id)}
              on:change={() => handlePlatformFilterChange(platform.id)}
            />
            <div 
              class="w-3 h-3 rounded-full mr-2" 
              style="background-color: {platform.color};"
            ></div>
            <span>{platform.label}</span>
          </label>
        {/each}
      </div>
    </div>
    
    <div class="mb-4">
      <h3 class="font-medium text-gray-900 mb-2">Status</h3>
      <div class="space-y-2">
        {#each statusOptions as status}
          <label class="flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              class="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
              checked={$filters.status.includes(status.id)}
              on:change={() => handleStatusFilterChange(status.id)}
            />
            <div 
              class="w-3 h-3 rounded-full mr-2" 
              style="background-color: {status.color};"
            ></div>
            <span>{status.label}</span>
          </label>
        {/each}
      </div>
    </div>
    
    <div class="mb-4">
      <h3 class="font-medium text-gray-900 mb-2">Search</h3>
      <input 
        type="text" 
        placeholder="Search content..." 
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        value={$filters.searchTerm}
        on:input={handleSearchInput}
      />
    </div>
    
    <div class="mb-4">
      <button 
        class="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        on:click={resetFilters}
      >
        Reset Filters
      </button>
    </div>
    
    <div class="mt-8">
      <h3 class="font-medium text-gray-900 mb-2">AI Suggestions</h3>
      <div class="border border-blue-200 bg-blue-50 rounded-md p-3">
        <p class="text-sm text-blue-800 mb-2">Based on your audience engagement:</p>
        <ul class="text-sm space-y-2">
          <li class="flex items-start">
            <span class="text-blue-600 mr-1">•</span> 
            Best time to post: Weekdays 9-11 AM
          </li>
          <li class="flex items-start">
            <span class="text-blue-600 mr-1">•</span> 
            Try using more images in your content
          </li>
          <li class="flex items-start">
            <span class="text-blue-600 mr-1">•</span> 
            LinkedIn posts are performing 15% better
          </li>
        </ul>
        <button class="w-full mt-3 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200">
          Get More Insights
        </button>
      </div>
    </div>
  </div>
</div>