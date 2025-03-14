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

// src/lib/services/postService.ts
import { db } from '$lib/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import type { Post } from '$lib/types/Post';

export const postCollection = 'posts';

export async function getPosts(userId: string): Promise<Post[]> {
  const postsRef = collection(db, postCollection);
  const q = query(postsRef, where('userId', '==', userId));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Post));
}

export async function addPost(post: Omit<Post, 'id'>): Promise<Post> {
  const postsRef = collection(db, postCollection);
  const docRef = await addDoc(postsRef, {
    ...post,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return {
    id: docRef.id,
    ...post
  } as Post;
}

export async function updatePost(postId: string, updatedData: Partial<Post>): Promise<void> {
  const postRef = doc(db, postCollection, postId);
  
  await updateDoc(postRef, {
    ...updatedData,
    updatedAt: serverTimestamp()
  });
}

export async function reschedulePost(postId: string, newScheduledTime: Date): Promise<void> {
  return updatePost(postId, { 
    scheduledTime: newScheduledTime.toISOString(),
    updatedAt: serverTimestamp()
  });
}

export async function deletePost(postId: string): Promise<void> {
  const postRef = doc(db, postCollection, postId);
  await deleteDoc(postRef);
}

// src/lib/stores/postStore.ts
import { writable } from 'svelte/store';
import type { Post } from '$lib/types/Post';
import { getPosts, addPost, updatePost, reschedulePost, deletePost } from '$lib/services/postService';
import { authStore } from '$lib/stores/authStore';
import { get } from 'svelte/store';

function createPostStore() {
  const { subscribe, set, update } = writable<{
    posts: Post[];
    loading: boolean;
    error: string | null;
  }>({
    posts: [],
    loading: false,
    error: null
  });

  return {
    subscribe,
    
    loadPosts: async () => {
      const currentUser = get(authStore).user;
      if (!currentUser) return;
      
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const posts = await getPosts(currentUser.uid);
        update(state => ({ ...state, posts, loading: false }));
      } catch (error) {
        console.error('Error loading posts:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: 'Failed to load posts. Please try again.' 
        }));
      }
    },
    
    addPost: async (newPost: Omit<Post, 'id'>) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const post = await addPost(newPost);
        
        update(state => ({ 
          ...state, 
          posts: [...state.posts, post], 
          loading: false 
        }));
        
        return post;
      } catch (error) {
        console.error('Error adding post:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: 'Failed to add post. Please try again.' 
        }));
        return null;
      }
    },
    
    updatePost: async (postId: string, updatedData: Partial<Post>) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        await updatePost(postId, updatedData);
        
        update(state => ({ 
          ...state, 
          posts: state.posts.map(post => 
            post.id === postId 
              ? { ...post, ...updatedData } 
              : post
          ), 
          loading: false 
        }));
        
        return true;
      } catch (error) {
        console.error('Error updating post:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: 'Failed to update post. Please try again.' 
        }));
        return false;
      }
    },
    
    reschedulePost: async (postId: string, newScheduledTime: Date) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        await reschedulePost(postId, newScheduledTime);
        
        update(state => ({ 
          ...state, 
          posts: state.posts.map(post => 
            post.id === postId 
              ? { ...post, scheduledTime: newScheduledTime.toISOString() } 
              : post
          ), 
          loading: false 
        }));
        
        return true;
      } catch (error) {
        console.error('Error rescheduling post:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: 'Failed to reschedule post. Please try again.' 
        }));
        return false;
      }
    },
    
    deletePost: async (postId: string) => {
      update(state => ({ ...state, loading: true, error: null }));
      
      try {
        await deletePost(postId);
        
        update(state => ({ 
          ...state, 
          posts: state.posts.filter(post => post.id !== postId), 
          loading: false 
        }));
        
        return true;
      } catch (error) {
        console.error('Error deleting post:', error);
        update(state => ({ 
          ...state, 
          loading: false, 
          error: 'Failed to delete post. Please try again.' 
        }));
        return false;
      }
    },
    
    reset: () => {
      set({ posts: [], loading: false, error: null });
    }
  };
}

export const postStore = createPostStore();

// Subscribe to auth changes to load posts when user logs in
authStore.subscribe(authState => {
  if (authState.user && !authState.loading) {
    postStore.loadPosts();
  } else if (!authState.user && !authState.loading) {
    postStore.reset();
  }
});

// src/routes/calendar/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { postStore } from '$lib/stores/postStore';
  import CalendarCell from '$lib/components/calendar/CalendarCell.svelte';
  import type { Post } from '$lib/types/Post';
  import { authStore } from '$lib/stores/authStore';
  import Button from '$lib/components/common/Button.svelte';
  import Modal from '$lib/components/common/Modal.svelte';
  import CreatePostForm from '$lib/components/posts/CreatePostForm.svelte';
  
  let currentDate = new Date();
  let calendarDates: Date[][] = [];
  let view: 'day' | 'week' | 'month' = 'month';
  let showCreatePostModal = false;
  let selectedDate: Date = new Date();
  
  // Store subscriptions
  $: posts = $postStore.posts;
  $: isLoading = $postStore.loading;
  $: error = $postStore.error;
  $: user = $authStore.user;
  
  // Navigate to previous period
  function prevPeriod() {
    if (view === 'day') {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
    } else if (view === 'week') {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
    } else {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    }
    generateCalendarDates();
  }
  
  // Navigate to next period
  function nextPeriod() {
    if (view === 'day') {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
    } else if (view === 'week') {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7);
    } else {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    generateCalendarDates();
  }
  
  // Go to today
  function goToToday() {
    currentDate = new Date();
    generateCalendarDates();
  }
  
  // Change view type
  function changeView(newView: 'day' | 'week' | 'month') {
    view = newView;
    generateCalendarDates();
  }
  
  // Generate calendar dates based on current date and view
  function generateCalendarDates() {
    if (view === 'month') {
      generateMonthView();
    } else if (view === 'week') {
      generateWeekView();
    } else {
      generateDayView();
    }
  }
  
  function generateMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const startingDay = firstDay.getDay();
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const monthLength = lastDay.getDate();
    
    // Create a 2D array for the calendar (6 weeks max)
    const calendar: Date[][] = [];
    let week: Date[] = [];
    
    // Add days from the previous month to fill the first row
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      week.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Add days of the current month
    for (let day = 1; day <= monthLength; day++) {
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
      week.push(new Date(year, month, day));
    }
    
    // Add days from the next month to fill the last row
    if (week.length > 0) {
      for (let day = 1; week.length < 7; day++) {
        week.push(new Date(year, month + 1, day));
      }
      calendar.push(week);
    }
    
    calendarDates = calendar;
  }
  
  function generateWeekView() {
    // Get the current day of the week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = currentDate.getDay();
    
    // Calculate the start date (Sunday) of the current week
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - dayOfWeek);
    
    // Create a 2D array with a single week
    const week: Date[] = [];
    
    // Add each day of the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      week.push(date);
    }
    
    calendarDates = [week];
  }
  
  function generateDayView() {
    // Create a 2D array with a single day
    calendarDates = [[new Date(currentDate)]];
  }
  
  // Format the current date for display
  $: formattedDate = formatDate(currentDate, view);
  
  function formatDate(date: Date, viewType: string): string {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric' 
    };
    
    if (viewType === 'day') {
      return date.toLocaleDateString('en-US', { 
        ...options, 
        weekday: 'long', 
        day: 'numeric' 
      });
    } else if (viewType === 'week') {
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short' })} ${startOfWeek.getDate()} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short' })} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      }
    } else {
      return date.toLocaleDateString('en-US', options);
    }
  }
  
  // Check if a date is today
  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  // Check if a date is in the current month
  function isCurrentMonth(date: Date): boolean {
    return date.getMonth() === currentDate.getMonth();
  }
  
  // Get posts for a specific date
  function getPostsForDate(date: Date): Post[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return posts.filter(post => {
      const postDate = new Date(post.scheduledTime);
      return postDate.getFullYear() === year &&
             postDate.getMonth() === month &&
             postDate.getDate() === day;
    });
  }
  
  // Handle post drop (rescheduling)
  async function handlePostDrop(event: CustomEvent<{ post: Post, newDate: Date }>) {
    const { post, newDate } = event.detail;
    
    try {
      await postStore.reschedulePost(post.id, newDate);
      // You could add a success notification here
    } catch (error) {
      console.error('Failed to reschedule post:', error);
      // You could add an error notification here
    }
  }
  
  // Handle opening the create post modal
  function handleCreatePost(event: CustomEvent<{ date: Date }>) {
    selectedDate = event.detail.date;
    showCreatePostModal = true;
  }
  
  // Handle post creation
  async function handlePostCreated(event: CustomEvent<Omit<Post, 'id'>>) {
    const newPost = event.detail;
    
    try {
      await postStore.addPost(newPost);
      showCreatePostModal = false;
      // You could add a success notification here
    } catch (error) {
      console.error('Failed to create post:', error);
      // You could add an error notification here
    }
  }
  
  // Initialize calendar on mount
  onMount(() => {
    generateCalendarDates();
  });
  
  // Watch for changes to view or current date
  $: if (view || currentDate) {
    generateCalendarDates();
  }
</script>

<div class="calendar-container p-4">
  <!-- Calendar Header -->
  <div class="flex justify-between items-center mb-4">
    <div class="flex items-center space-x-2">
      <Button on:click={prevPeriod} variant="outline" size="sm">
        <span class="material-icons text-sm">chevron_left</span>
      </Button>
      <h1 class="text-xl font-semibold">{formattedDate}</h1>
      <Button on:click={nextPeriod} variant="outline" size="sm">
        <span class="material-icons text-sm">chevron_right</span>
      </Button>
      <Button on:click={goToToday} variant="outline" size="sm" class="ml-2">Today</Button>
    </div>
    
    <div class="flex items-center space-x-2">
      <div class="bg-gray-100 rounded-md p-1 flex">
        <button 
          class="px-3 py-1 text-sm rounded-md {view === 'day' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}"
          on:click={() => changeView('day')}>
          Day
        </button>
        <button 
          class="px-3 py-1 text-sm rounded-md {view === 'week' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}"
          on:click={() => changeView('week')}>
          Week
        </button>
        <button 
          class="px-3 py-1 text-sm rounded-md {view === 'month' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}"
          on:click={() => changeView('month')}>
          Month
        </button>
      </div>
    </div>
  </div>
  
  <!-- Day Names Header -->
  <div class="grid grid-cols-7 mb-2">
    {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
      <div class="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
    {/each}
  </div>
  
  <!-- Calendar Grid -->
  {#if calendarDates.length > 0}
    <div class="grid grid-cols-7 gap-1" 
      class:grid-rows-1={view === 'day' || view === 'week'} 
      class:grid-rows-6={view === 'month' && calendarDates.length === 6}
      class:grid-rows-5={view === 'month' && calendarDates.length === 5}>
      
      {#each calendarDates as week}
        {#each week as date}
          <div 
            class="min-h-24 {view === 'day' ? 'col-span-7' : ''}"
            class:col-span-1={view !== 'day'}>
            <CalendarCell 
              {date}
              {view}
              isToday={isToday(date)} 
              isCurrentMonth={isCurrentMonth(date)}
              posts={getPostsForDate(date)}
              on:drop={handlePostDrop}
              on:createPost={handleCreatePost} />
          </div>
        {/each}
      {/each}
    </div>
  {/if}
  
  <!-- Loading State -->
  {#if isLoading}
    <div class="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center">
      <div class="spinner"></div>
    </div>
  {/if}
  
  <!-- Error State -->
  {#if error}
    <div class="bg-red-100 text-red-700 p-3 rounded-md mt-4">
      {error}
    </div>
  {/if}
</div>

<!-- Create Post Modal -->
<Modal 
  title="Create New Post" 
  bind:open={showCreatePostModal} 
  on:close={() => showCreatePostModal = false}>
  
  <CreatePostForm 
    initialDate={selectedDate}
    on:submit={handlePostCreated}
    on:cancel={() => showCreatePostModal = false} />
</Modal>

<style>
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s ease-in-out infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>

// src/lib/types/Post.ts
export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  scheduledTime: string; // ISO string
  platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  mediaUrls?: string[];
  tags?: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}