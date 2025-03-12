<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { createPost } from '$lib/services/postService';
  import { uploadMediaFiles } from '$lib/services/storageService';
  import { getAuth } from 'firebase/auth';
  import type { PlatformType, PostStatus } from '$lib/types/calendar';
  import Button from '$lib/components/Button.svelte';
  import Modal from '$lib/components/Modal.svelte';
  
  export let show = false;
  export let initialDate: Date;
  
  const dispatch = createEventDispatcher();
  
  // Form data
  let title = '';
  let content = '';
  let scheduledDate = initialDate;
  let scheduledTime = '12:00';
  let selectedPlatforms: PlatformType[] = ['twitter'];
  let tags = '';
  let mediaFiles: FileList | null = null;
  
  // Form state
  let isSubmitting = false;
  let error = '';
  let mediaPreviewUrls: string[] = [];
  
  // Reset form to initial state
  function resetForm() {
    title = '';
    content = '';
    scheduledDate = initialDate;
    scheduledTime = '12:00';
    platform = SocialPlatform.Twitter;
    tags = '';
    mediaFiles = null;
    mediaPreviewUrls = [];
    error = '';
  }
  
  // Handle modal close
  function handleClose() {
    resetForm();
    dispatch('close');
  }
  
  // Handle file selection
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    mediaFiles = input.files;
    
    // Create preview URLs
    mediaPreviewUrls = [];
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      if (file.type.startsWith('image/')) {
        mediaPreviewUrls.push(URL.createObjectURL(file));
      }
    }
  }
  
  // Handle form submission
  async function handleSubmit() {
    try {
      isSubmitting = true;
      error = '';
      
      // Validate form
      if (!content.trim()) {
        error = 'Content is required';
        return;
      }
      
      if (selectedPlatforms.length === 0) {
        error = 'At least one platform must be selected';
        return;
      }
      
      // Combine date and time
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const scheduleDateTime = new Date(scheduledDate);
      scheduleDateTime.setHours(hours, minutes);
      
      // Convert tags string to array
      const tagsArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Upload media files if any
      let mediaUrls: string[] = [];
      if (mediaFiles && mediaFiles.length > 0) {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;
        
        if (!userId) {
          error = 'You must be logged in to upload media';
          return;
        }
        
        mediaUrls = await uploadMediaFiles(mediaFiles, userId);
      }
      
      // Create post object
      const newPost = {
        content,
        scheduledTime: scheduleDateTime,
        platforms: selectedPlatforms,
        status: 'scheduled' as PostStatus,
        tags: tagsArray,
        mediaUrls,
        aiGenerated: false,
        isRecurring: false
      };
      
      // Save to Firebase
      const postId = await createPost(newPost);
      
      // Notify parent component
      dispatch('created', { postId });
      
      // Close modal and reset form
      handleClose();
    } catch (err) {
      console.error('Error creating post:', err);
      error = 'Failed to create post. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  $: {
    // Update scheduled date when initialDate changes
    if (initialDate) {
      scheduledDate = initialDate;
    }
  }
</script>

<Modal {show} on:close={handleClose} title="Create New Post">
  <div class="post-form">
    {#if error}
      <div class="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleSubmit}>

      
      <div class="mb-4">
        <label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          id="content"
          bind:value={content}
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-32"
          placeholder="Write your post content here..."
          disabled={isSubmitting}
        ></textarea>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label for="scheduledDate" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            id="scheduledDate"
            bind:value={scheduledDate}
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label for="scheduledTime" class="block text-sm font-medium text-gray-700 mb-1">Time</label>
          <input
            type="time"
            id="scheduledTime"
            bind:value={scheduledTime}
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Platforms</label>
        <div class="flex flex-wrap gap-2">
          <div class="flex items-center">
            <input
              type="checkbox"
              id="platform-twitter"
              value="twitter"
              checked={selectedPlatforms.includes('twitter')}
              on:change={(e) => {
                if (e.target.checked) {
                  selectedPlatforms = [...selectedPlatforms, 'twitter'];
                } else {
                  selectedPlatforms = selectedPlatforms.filter(p => p !== 'twitter');
                }
              }}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label for="platform-twitter" class="ml-2 text-sm text-gray-700">Twitter</label>
          </div>
          
          <div class="flex items-center">
            <input
              type="checkbox"
              id="platform-facebook"
              value="facebook"
              checked={selectedPlatforms.includes('facebook')}
              on:change={(e) => {
                if (e.target.checked) {
                  selectedPlatforms = [...selectedPlatforms, 'facebook'];
                } else {
                  selectedPlatforms = selectedPlatforms.filter(p => p !== 'facebook');
                }
              }}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label for="platform-facebook" class="ml-2 text-sm text-gray-700">Facebook</label>
          </div>
          
          <div class="flex items-center">
            <input
              type="checkbox"
              id="platform-instagram"
              value="instagram"
              checked={selectedPlatforms.includes('instagram')}
              on:change={(e) => {
                if (e.target.checked) {
                  selectedPlatforms = [...selectedPlatforms, 'instagram'];
                } else {
                  selectedPlatforms = selectedPlatforms.filter(p => p !== 'instagram');
                }
              }}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label for="platform-instagram" class="ml-2 text-sm text-gray-700">Instagram</label>
          </div>
          
          <div class="flex items-center">
            <input
              type="checkbox"
              id="platform-linkedin"
              value="linkedin"
              checked={selectedPlatforms.includes('linkedin')}
              on:change={(e) => {
                if (e.target.checked) {
                  selectedPlatforms = [...selectedPlatforms, 'linkedin'];
                } else {
                  selectedPlatforms = selectedPlatforms.filter(p => p !== 'linkedin');
                }
              }}
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label for="platform-linkedin" class="ml-2 text-sm text-gray-700">LinkedIn</label>
          </div>
        </div>
      </div>
      
      <div class="mb-4">
        <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
        <input
          type="text"
          id="tags"
          bind:value={tags}
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="e.g. marketing, social, promotion"
          disabled={isSubmitting}
        />
      </div>
      
      <div class="mb-4">
        <label for="media" class="block text-sm font-medium text-gray-700 mb-1">Media (optional)</label>
        <input
          type="file"
          id="media"
          multiple
          accept="image/*,video/*"
          on:change={handleFileSelect}
          class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          disabled={isSubmitting}
        />
      </div>
      
      {#if mediaPreviewUrls.length > 0}
        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">Media Preview:</p>
          <div class="grid grid-cols-3 gap-2">
            {#each mediaPreviewUrls as url}
              <div class="relative h-24 bg-gray-100 rounded overflow-hidden">
                <img src={url} alt="Preview" class="h-full w-full object-cover" />
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <div class="flex justify-end gap-3 mt-6">
        <Button type="button" variant="secondary" on:click={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Post'}
        </Button>
      </div>
    </form>
  </div>
</Modal>