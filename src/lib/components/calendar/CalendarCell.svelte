// src/lib/components/calendar/CalendarCell.svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Post } from '$lib/types/Post';
  import DraggablePost from './DraggablePost.svelte';
  
  export let date: Date;
  export let isToday: boolean = false;
  export let isCurrentMonth: boolean = true;
  export let posts: Post[] = [];
  export let view: 'day' | 'week' | 'month' = 'month';
  
  const dispatch = createEventDispatcher<{
    drop: { post: Post, newDate: Date };
    click: { date: Date };
    createPost: { date: Date };
  }>();
  
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  
  function handleDrop(event: DragEvent) {
    event.preventDefault();
    
    if (event.dataTransfer) {
      try {
        const postJson = event.dataTransfer.getData('application/json');
        const post: Post = JSON.parse(postJson);
        
        // Create a new date at the same time, but on the dropped date
        const oldDate = new Date(post.scheduledTime);
        const newDate = new Date(date);
        newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
        
        dispatch('drop', { post, newDate });
      } catch (error) {
        console.error('Error parsing dragged post:', error);
      }
    }
  }
  
  function handleCellClick() {
    dispatch('click', { date });
  }
  
  function handleAddPost() {
    dispatch('createPost', { date });
  }

  // Sort posts by time
  $: sortedPosts = [...posts].sort((a, b) => 
    new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  );

  // Determine max posts to display based on view
  $: maxPostsToShow = view === 'month' ? 3 : 10;
  $: hasMorePosts = posts.length > maxPostsToShow;
</script>

<div 
  class="calendar-cell relative h-full border border-gray-200 p-1 overflow-hidden
    {isCurrentMonth ? 'bg-white' : 'bg-gray-50'} 
    {isToday ? 'ring-2 ring-blue-200' : ''}"
  on:dragover={handleDragOver}
  on:drop={handleDrop}
  on:click={handleCellClick}>
  
  <div class="flex justify-between items-center mb-1">
    <div 
      class="text-sm font-medium {isToday ? 'text-blue-600 font-bold' : ''}
            {!isCurrentMonth ? 'text-gray-400' : ''}">
      {date.getDate()}
    </div>
    
    <button 
      class="text-gray-400 hover:text-gray-600 text-xs p-1 rounded-full hover:bg-gray-100"
      on:click|stopPropagation={handleAddPost}>
      +
    </button>
  </div>
  
  <div class="post-container overflow-y-auto max-h-{view === 'month' ? 28 : 64}">
    {#each sortedPosts.slice(0, maxPostsToShow) as post (post.id)}
      <DraggablePost {post} />
    {/each}
    
    {#if hasMorePosts}
      <div class="text-xs text-gray-500 text-center mt-1">
        +{posts.length - maxPostsToShow} more
      </div>
    {/if}
  </div>
</div>