<!-- src/routes/dashboard/create/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/authStore';
  import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
  import { db } from '$lib/firebase/firebase';
  import { goto } from '$app/navigation';
  
  let content = '';
  let hashtags = '';
  let scheduledDate = '';
  let scheduledTime = '';
  let platform = 'twitter';
  let isScheduled = false;
  let loading = false;
  let error = '';
  let success = '';
  let mediaFiles = [];
  
  onMount(() => {
    // Set default time to now + 1 hour, rounded to nearest 15 minutes
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    const today = new Date().toISOString().split('T')[0];
    scheduledDate = today;
    scheduledTime = now.toTimeString().substring(0, 5);
  });
  
  async function handleSubmit() {
    if (!content) {
      error = 'Content is required';
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    
    try {
      // Parse hashtags
      const hashtagArray = hashtags
        .split(' ')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`);
      
      // Create the post object
      const post = {
        userId: $user.uid,
        content,
        hashtags: hashtagArray,
        media: [], // In a full version, you'd upload media files and store URLs here
        platform,
        createdAt: serverTimestamp(),
        status: isScheduled ? 'scheduled' : 'draft'
      };
      
      if (isScheduled) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        post.scheduledAt = scheduledDateTime;
      }
      
      // Add the post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), post);
      
      // If scheduled, add to the schedule collection as well
      if (isScheduled) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const dateString = scheduledDateTime.toISOString().split('T')[0];
        
        // Check if there's already a schedule for this date
        const scheduleData = {
          userId: $user.uid,
          date: scheduledDateTime,
          timeSlots: [scheduledTime],
          postIds: [docRef.id],
          isRecurring: false
        };
        
        await addDoc(collection(db, 'schedules'), scheduleData);
      }
      
      success = isScheduled ? 'Post scheduled successfully!' : 'Draft saved successfully!';
      
      // Reset form after success
      setTimeout(() => {
        content = '';
        hashtags = '';
        mediaFiles = [];
        
        // Navigate to calendar or posts view
        goto('/dashboard/calendar');
      }, 2000);
    } catch (e) {
      console.error('Error creating post:', e);
      error = e.message;
    } finally {
      loading = false;
    }
  }
  
  function handleFileChange(event) {
    const files = event.target.files;
    if (files.length > 0) {
      mediaFiles = Array.from(files);
    }
  }
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-6">Create Content</h1>
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div>
      <label for="content" class="block text-sm font-medium text-gray-700">Content</label>
      <div class="mt-1">
        <textarea
          id="content"
          name="content"
          rows="5"
          bind:value={content}
          placeholder="What do you want to share?"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
        ></textarea>
        <div class="text-xs text-gray-500 mt-1">
          {content.length} / 280 characters
        </div>
      </div>
    </div>
    
    <div>
      <label for="hashtags" class="block text-sm font-medium text-gray-700">Hashtags</label>
      <div class="mt-1">
        <input
          type="text"
          id="hashtags"
          name="hashtags"
          bind:value={hashtags}
          placeholder="#contentcalendar #socialmedia"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
        />
      </div>
    </div>
    
    <div>
      <label for="media" class="block text-sm font-medium text-gray-700">Media (optional)</label>
      <div class="mt-1">
        <input
          type="file"
          id="media"
          name="media"
          multiple
          accept="image/*, video/*"
          on:change={handleFileChange}
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
        />
        {#if mediaFiles.length > 0}
          <div class="mt-2 flex flex-wrap gap-2">
            {#each mediaFiles as file}
              <div class="relative">
                <div class="h-16 w-16 border rounded-md flex items-center justify-center">
                  <span class="text-xs text-center p-1">{file.name}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    
    <div>
      <label for="platform" class="block text-sm font-medium text-gray-700">Platform</label>
      <select
        id="platform"
        name="platform"
        bind:value={platform}
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="twitter">Twitter/X</option>
        <!-- Add more platforms in the future -->
        <option value="linkedin" disabled>LinkedIn (coming soon)</option>
        <option value="facebook" disabled>Facebook (coming soon)</option>
        <option value="instagram" disabled>Instagram (coming soon)</option>
      </select>
    </div>
    
    <div class="flex items-start">
      <div class="flex items-center h-5">
        <input
          id="isScheduled"
          name="isScheduled"
          type="checkbox"
          bind:checked={isScheduled}
          class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
        />
      </div>
      <div class="ml-3 text-sm">
        <label for="isScheduled" class="font-medium text-gray-700">Schedule this post</label>
      </div>
    </div>
    
    {#if isScheduled}
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="scheduledDate" class="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            id="scheduledDate"
            name="scheduledDate"
            bind:value={scheduledDate}
            min={new Date().toISOString().split('T')[0]}
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label for="scheduledTime" class="block text-sm font-medium text-gray-700">Time</label>
          <input
            type="time"
            id="scheduledTime"
            name="scheduledTime"
            bind:value={scheduledTime}
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>
    {/if}
    
    {#if error}
      <div class="text-red-500">{error}</div>
    {/if}
    
    {#if success}
      <div class="text-green-500">{success}</div>
    {/if}
    
    <div class="flex justify-end">
      <button
        type="button"
        class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
        on:click={() => goto('/dashboard/calendar')}
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 {loading ? 'opacity-70' : ''}"
      >
        {#if loading}
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        {/if}
        {isScheduled ? 'Schedule Post' : 'Save Draft'}
      </button>
    </div>
  </form>
</div>