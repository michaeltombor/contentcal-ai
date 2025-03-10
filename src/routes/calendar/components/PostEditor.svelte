<!-- src/routes/calendar/components/PostEditor.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { SocialMediaPost, PlatformType } from '$lib/types/calendar';
  import { updatePost, deletePost } from '$lib/services/postService';
  
  export let post: SocialMediaPost;
  export let onClose: () => void;
  
  // Create local copies of the post data for editing
  let content = post.content;
  let scheduledTime = new Date(post.scheduledTime);
  let selectedPlatforms = [...post.platforms];
  let mediaUrls = post.mediaUrls ? [...post.mediaUrls] : [];
  let hashtags = post.hashtags ? [...post.hashtags] : [];
  let status = post.status;
  let formattedDate = '';
  let formattedTime = '';
  let isDirty = false;
  
  // Platform options
  const platformOptions: { id: PlatformType; name: string; icon: string; color: string }[] = [
    { 
      id: 'twitter', 
      name: 'Twitter', 
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>', 
      color: '#1DA1F2'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>', 
      color: '#E1306C'
    },
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>', 
      color: '#4267B2'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>', 
      color: '#0077B5'
    }
  ];
  
  // Track if any changes were made to detect unsaved changes
  $: {
    isDirty = content !== post.content || 
              scheduledTime.getTime() !== post.scheduledTime.getTime() ||
              !arraysEqual(selectedPlatforms, post.platforms) ||
              !arraysEqual(hashtags, post.hashtags || []);
  }
  
  // Format date and time
  onMount(() => {
    formatDateTime();
  });
  
  function formatDateTime() {
    // Format date for input
    const year = scheduledTime.getFullYear();
    const month = String(scheduledTime.getMonth() + 1).padStart(2, '0');
    const day = String(scheduledTime.getDate()).padStart(2, '0');
    formattedDate = `${year}-${month}-${day}`;
    
    // Format time for input
    const hours = String(scheduledTime.getHours()).padStart(2, '0');
    const minutes = String(scheduledTime.getMinutes()).padStart(2, '0');
    formattedTime = `${hours}:${minutes}`;
  }
  
  // Compare arrays for equality
  function arraysEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }
  
  // Toggle platform selection
  function togglePlatform(platform: PlatformType) {
    if (selectedPlatforms.includes(platform)) {
      selectedPlatforms = selectedPlatforms.filter(p => p !== platform);
    } else {
      selectedPlatforms = [...selectedPlatforms, platform];
    }
  }
  
  // Handle date change
  function handleDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const [year, month, day] = input.value.split('-').map(n => parseInt(n));
    
    const newDate = new Date(scheduledTime);
    newDate.setFullYear(year);
    newDate.setMonth(month - 1);
    newDate.setDate(day);
    
    scheduledTime = newDate;
  }
  
  // Handle time change
  function handleTimeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const [hours, minutes] = input.value.split(':').map(n => parseInt(n));
    
    const newDate = new Date(scheduledTime);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    
    scheduledTime = newDate;
  }
  
  // Handle hashtag input
  function handleHashtagInput(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      const value = input.value.trim().replace(/^#/, '');
      
      if (value && !hashtags.includes(value)) {
        hashtags = [...hashtags, value];
        input.value = '';
      }
    }
  }
  
  // Remove hashtag
  function removeHashtag(tag: string) {
    hashtags = hashtags.filter(t => t !== tag);
  }
  
  // Save changes
  async function saveChanges() {
    try {
      await updatePost(post.id, {
        content,
        scheduledTime,
        platforms: selectedPlatforms,
        hashtags,
        status,
        updatedAt: new Date()
      });
      
      isDirty = false;
    } catch (error) {
      console.error('Error saving post:', error);
      // TODO: Show error toast
    }
  }
  
  // Delete post
  async function handleDeletePost() {
    if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost(post.id);
        onClose();
      } catch (error) {
        console.error('Error deleting post:', error);
        // TODO: Show error toast
      }
    }
  }
  
  // Character limits by platform
  const characterLimits: Record<PlatformType, number> = {
    twitter: 280,
    instagram: 2200,
    facebook: 63206,
    linkedin: 3000
  };
  
  // Calculate the lowest character limit based on selected platforms
  $: lowestLimit = selectedPlatforms.length > 0 
    ? Math.min(...selectedPlatforms.map(p => characterLimits[p])) 
    : 280;
  
  // Calculate remaining characters
  $: remainingChars = lowestLimit - content.length;
  
  // Generate content preview
  $: contentPreview = content + 
                      (hashtags.length > 0 ? '\n\n' + hashtags.map(tag => `#${tag}`).join(' ') : '');

  // Custom function to render HTML safely (for platform icons)
  function renderHTML(html: string) {
    return { __html: html };
  }
</script>

<div class="h-full flex flex-col">
  <div class="p-4 border-b flex justify-between items-center">
    <h2 class="font-medium">Edit Post</h2>
    <button on:click={onClose} class="text-gray-500 hover:text-gray-700">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
  
  <div class="p-4 flex-1 overflow-y-auto">
    <!-- Platform Selection -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Platforms
      </label>
      <div class="flex flex-wrap gap-2">
        {#each platformOptions as platform}
          <button 
            class="flex items-center px-3 py-1 rounded-full text-sm {selectedPlatforms.includes(platform.id) ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}"
            on:click={() => togglePlatform(platform.id)}
          >
            <span class="mr-1" style="color: {platform.color};">{@html platform.icon}</span>
            {platform.name}
          </button>
        {/each}
      </div>
    </div>
    
    <!-- Schedule -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Schedule
      </label>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <input 
            type="date" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formattedDate}
            on:change={handleDateChange}
          />
        </div>
        <div>
          <input 
            type="time" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={formattedTime}
            on:change={handleTimeChange}
          />
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="mb-4">
      <div class="flex justify-between items-center mb-1">
        <label class="block text-sm font-medium text-gray-700">
          Content
        </label>
        <span class={`text-xs ${remainingChars < 0 ? 'text-red-500' : remainingChars < 20 ? 'text-yellow-500' : 'text-gray-500'}`}>
          {remainingChars} characters left
        </span>
      </div>
      <textarea 
        rows="5" 
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        bind:value={content}
      ></textarea>
    </div>
    
    <!-- Hashtags -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Hashtags
      </label>
      <input 
        type="text" 
        placeholder="Add hashtags (press Enter or comma to add)"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
        on:keydown={handleHashtagInput}
      />
      
      <div class="flex flex-wrap gap-2">
        {#each hashtags as tag}
          <div class="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm flex items-center">
            #{tag}
            <button 
              class="ml-1 text-gray-500 hover:text-gray-700"
              on:click={() => removeHashtag(tag)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Media Upload (Placeholder) -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Media
      </label>
      <div class="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="mt-1 text-sm text-gray-500">
          Drag and drop image files here, or
        </p>
        <button class="mt-2 px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
          Browse Files
        </button>
      </div>
    </div>
    
    <!-- Post Preview -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Preview
      </label>
      <div class="bg-gray-50 border border-gray-200 rounded-md p-3">
        <div class="flex items-center mb-2">
          <div class="w-8 h-8 bg-gray-300 rounded-full"></div>
          <div class="ml-2">
            <div class="text-sm font-medium text-gray-800">Your Account</div>
            <div class="text-xs text-gray-500">
              {new Date(scheduledTime).toLocaleString()}
            </div>
          </div>
        </div>
        <div class="text-sm whitespace-pre-wrap">{contentPreview}</div>
      </div>
    </div>
    
    <!-- Status Selection -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Status
      </label>
      <select 
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        bind:value={status}
      >
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="published">Published</option>
      </select>
    </div>
  </div>
  
  <!-- Action buttons -->
  <div class="p-4 border-t flex justify-between">
    <button 
      on:click={handleDeletePost}
      class="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
    >
      Delete
    </button>
    
    <div class="space-x-2">
      <button 
        on:click={onClose}
        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
      >
        Cancel
      </button>
      
      <button 
        on:click={saveChanges}
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        disabled={!isDirty || selectedPlatforms.length === 0 || remainingChars < 0}
      >
        Save Changes
      </button>
    </div>
  </div>
</div>