<!-- src/routes/calendar/components/PostCreateModal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from '$lib/components/common/Button.svelte';
  import Modal from '$lib/components/common/Modal.svelte';
  import { postStore } from '$lib/stores/postStore';
  import { authStore } from '$lib/stores/authStore';
  import { toastStore } from '$lib/stores/toastStore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  // Import from centralized Firebase file
  import { auth, storage, getCurrentUser } from '$lib/firebase';
  import type { Post } from '$lib/types/Post';
  
  // Component props
  export let selectedDate: Date | null = null;
  export let post: Post | null = null;
  
  // Local state
  let isSubmitting = false;
  let socialPlatforms = ['Twitter', 'Facebook', 'Instagram', 'LinkedIn'];
  let imageFile: File | null = null;
  let imagePreviewUrl: string | null = null;
  let uploadProgress = 0;
  
  // Form data with proper defaults
  let formData = {
    content: '',
    scheduledDate: selectedDate ? new Date(selectedDate) : new Date(),
    platforms: ['Twitter'] as string[],
    mediaUrls: [] as string[],
    tags: [] as string[]
  };
  
  // Initialize form with post data if editing
  $: if (post) {
    formData = { 
      ...formData,
      content: post.content || '',
      scheduledDate: new Date(post.scheduledDate) || new Date(),
      platforms: post.platforms || [post.platform] || ['Twitter'],
      mediaUrls: post.mediaUrls || [],
      tags: post.tags || []
    };
  }
  
  // Format date for datetime-local input
  function formatDateForInput(date: Date): string {
    // Format as YYYY-MM-DDThh:mm
    return date.toISOString().slice(0, 16);
  }
  
  // Initial scheduled date
  $: scheduledDateFormatted = formatDateForInput(formData.scheduledDate);
  
  // Set up event dispatcher
  const dispatch = createEventDispatcher();
  
  // Close modal
  function handleClose() {
    dispatch('close');
  }
  
  // Upload image to Firebase Storage
  async function uploadImage(userId?: string): Promise<string | null> {
    if (!imageFile) {
      return null;
    }
    
    try {
      // Use provided userId or try to get from auth
      const uid = userId || auth.currentUser?.uid;
      
      if (!uid) {
        throw new Error('User ID not available for upload');
      }
      
      const storageRef = ref(storage, `users/${uid}/posts/${Date.now()}_${imageFile.name}`);
      
      // Upload the file
      const uploadTask = await uploadBytes(storageRef, imageFile);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      toastStore.error('Failed to upload image');
      return null;
    }
  }
  
  // Handle image file selection
  function handleImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Check file type
      if (!file.type.match('image.*')) {
        toastStore.error('Please select an image file');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toastStore.error('Image file size must be less than 5MB');
        return;
      }
      
      // Set the file and create preview URL
      imageFile = file;
      imagePreviewUrl = URL.createObjectURL(file);
    } else {
      // Clear image if no file selected
      imageFile = null;
      imagePreviewUrl = null;
    }
  }
  
  // Remove selected image
  function removeImage() {
    imageFile = null;
    imagePreviewUrl = null;
    // Reset the file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  // Request AI suggestions (can be implemented later)
  function requestSuggestions() {
    // Will call aiService here
    toastStore.info('AI suggestions coming soon!');
  }
  
  // Save post
  async function handleSave() {
    try {
      isSubmitting = true;
      
      // Get current auth state directly from auth
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        toastStore.error('You must be logged in to save posts');
        return;
      }
      
      // Use the Firebase user ID directly
      const userId = currentUser.uid;
      
      // Upload image if one is selected
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(userId);
      }
      
      // Prepare media URLs array with the new image if uploaded
      const mediaUrls = [...formData.mediaUrls];
      if (imageUrl) {
        mediaUrls.push(imageUrl);
      }
      
      const postData: Partial<Post> = {
        content: formData.content,
        scheduledDate: formData.scheduledDate.toISOString(),
        platforms: formData.platforms,
        platform: formData.platforms[0], // For backward compatibility
        mediaUrls: mediaUrls,
        tags: formData.tags,
        userId: userId,
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };
      
      if (post?.id) {
        // Update existing post
        await postStore.updatePost(post.id, postData);
        toastStore.success('Post updated successfully!');
      } else {
        // Create new post
        await postStore.createPost(postData);
        toastStore.success('Post created successfully!');
      }
      
      // Clean up any object URLs to prevent memory leaks
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      
      dispatch('save');
    } catch (error) {
      console.error('Error saving post:', error);
      toastStore.error('Failed to save post');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Modal on:close={handleClose}>
  <div class="post-modal" transition:fade>
    <h2 class="text-xl font-bold mb-4">
      {post ? 'Edit Post' : 'Create New Post'}
    </h2>
    
    <form on:submit|preventDefault={handleSave} class="space-y-4">
      <!-- Platform selection -->
      <div class="form-group">
        <label class="block text-sm font-medium mb-2">Platforms</label>
        <div class="space-y-2">
          {#each socialPlatforms as platform}
            <label class="inline-flex items-center mr-4">
              <input 
                type="checkbox" 
                value={platform}
                class="form-checkbox h-4 w-4 text-blue-600"
                checked={formData.platforms.includes(platform)}
                on:change={(e) => {
                  if (e.target.checked) {
                    formData.platforms = [...formData.platforms, platform];
                  } else {
                    formData.platforms = formData.platforms.filter(p => p !== platform);
                  }
                }}
              />
              <span class="ml-2 text-sm">{platform}</span>
            </label>
          {/each}
        </div>
      </div>
      
      <!-- Post content -->
      <div class="form-group">
        <label for="content" class="block text-sm font-medium mb-1">Content</label>
        <textarea
          id="content"
          class="w-full p-2 border rounded h-32"
          placeholder="Write your post content here..."
          bind:value={formData.content}
        ></textarea>
        
        <!-- Character count based on platforms -->
        <div class="text-sm text-gray-500 mt-1">
          {#if formData.platforms.includes('Twitter')}
            {280 - (formData.content?.length || 0)} characters remaining (Twitter)
          {/if}
          {formData.content?.length || 0} characters total
        </div>
        
        <!-- AI suggestion button -->
        <button 
          type="button"
          class="text-sm text-blue-500 mt-2"
          on:click={requestSuggestions}
        >
          Get AI content suggestions
        </button>
      </div>
      
      <!-- Image upload section -->
      <div class="form-group">
        <label for="image-upload" class="block text-sm font-medium mb-1">Add Image</label>
        
        {#if imagePreviewUrl}
          <!-- Image preview -->
          <div class="relative mt-2 mb-4">
            <img 
              src={imagePreviewUrl} 
              alt="Preview" 
              class="max-h-48 rounded border border-gray-200"
            />
            <button
              type="button"
              class="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-100"
              on:click={removeImage}
              aria-label="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        {:else}
          <!-- File input -->
          <div class="mt-1 flex items-center">
            <label
              for="image-upload"
              class="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Image
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              class="sr-only"
              on:change={handleImageChange}
            />
            <span class="ml-3 text-sm text-gray-500">JPG, PNG, GIF up to 5MB</span>
          </div>
        {/if}
      </div>
      
      <!-- Scheduled date/time -->
      <div class="form-group">
        <label for="scheduledDate" class="block text-sm font-medium mb-1">Schedule for</label>
        <input 
          id="scheduledDate" 
          type="datetime-local"
          class="w-full p-2 border rounded"
          bind:value={scheduledDateFormatted}
          on:change={(e) => {
            formData.scheduledDate = new Date(e.currentTarget.value);
          }}
        />
      </div>
      
      <!-- Action buttons -->
      <div class="flex justify-end space-x-2 mt-6">
        <Button variant="secondary" on:click={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          type="submit" 
          disabled={isSubmitting || !formData.content || formData.platforms.length === 0}
        >
          {isSubmitting ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
        </Button>
      </div>
    </form>
  </div>
</Modal>