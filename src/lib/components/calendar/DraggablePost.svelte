// src/lib/components/calendar/DraggablePost.svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Post } from '$lib/types/Post';
  import { fly } from 'svelte/transition';
  
  export let post: Post;
  export let isDragging: boolean = false;
  
  const dispatch = createEventDispatcher<{
    dragstart: { post: Post, event: DragEvent };
    dragend: { post: Post, event: DragEvent };
  }>();
  
  function handleDragStart(event: DragEvent) {
    if (!event.dataTransfer) return;
    
    // Set the data being dragged
    event.dataTransfer.setData('application/json', JSON.stringify(post));
    event.dataTransfer.effectAllowed = 'move';
    
    // Add a custom class for styling
    setTimeout(() => {
      isDragging = true;
    }, 0);
    
    dispatch('dragstart', { post, event });
  }
  
  function handleDragEnd(event: DragEvent) {
    isDragging = false;
    dispatch('dragend', { post, event });
  }
</script>

<div 
  class="draggable-post {isDragging ? 'opacity-50' : ''} bg-white rounded-md shadow-md p-3 mb-2 cursor-grab border-l-4"
  class:border-blue-500={post.platform === 'twitter'}
  class:border-purple-500={post.platform === 'instagram'}
  class:border-blue-700={post.platform === 'facebook'}
  class:border-blue-900={post.platform === 'linkedin'}
  draggable="true"
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  transition:fly={{ y: 20, duration: 300 }}
  data-post-id={post.id}>
  
  <div class="text-sm font-semibold mb-1 flex items-center justify-between">
    <span>{post.title || 'Untitled Post'}</span>
    <span class="text-xs text-gray-500">{new Date(post.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
  </div>
  
  <div class="text-xs text-gray-600 line-clamp-2">{post.content}</div>
  
  {#if post.mediaUrls && post.mediaUrls.length > 0}
    <div class="mt-1">
      <span class="text-xs text-gray-500">📎 {post.mediaUrls.length} attachment{post.mediaUrls.length > 1 ? 's' : ''}</span>
    </div>
  {/if}
  
  <div class="mt-1 flex justify-between items-center">
    <div>
      {#if post.tags && post.tags.length > 0}
        <div class="flex flex-wrap gap-1">
          {#each post.tags.slice(0, 2) as tag}
            <span class="text-xs bg-gray-100 rounded-full px-2 py-0.5">#{tag}</span>
          {/each}
          {#if post.tags.length > 2}
            <span class="text-xs bg-gray-100 rounded-full px-2 py-0.5">+{post.tags.length - 2}</span>
          {/if}
        </div>
      {/if}
    </div>
    <div class="flex items-center">
      {#if post.platform === 'twitter'}
        <span class="text-blue-500 text-xs">𝕏</span>
      {:else if post.platform === 'instagram'}
        <span class="text-purple-500 text-xs">IG</span>
      {:else if post.platform === 'facebook'}
        <span class="text-blue-700 text-xs">FB</span>
      {:else if post.platform === 'linkedin'}
        <span class="text-blue-900 text-xs">LI</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .draggable-post {
    transition: transform 0.2s, opacity 0.2s;
  }
  
  .draggable-post:hover {
    transform: translateY(-2px);
  }
</style>



