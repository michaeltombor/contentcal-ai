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