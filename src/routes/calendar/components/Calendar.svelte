<!-- src/routes/calendar/components/Calendar.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    calendarViewState, 
    filteredEvents, 
    navigateToToday, 
    navigateToPrevious, 
    navigateToNext, 
    changeView,
    selectEvent,
    clearSelection,
    startDrag,
    handleDrop
  } from '$lib/stores/calendarStore';
  import { 
    postsStore, 
    calendarEventsStore, 
    subscribeToPosts, 
    subscribeToCalendarEvents,
    loadingPosts
  } from '$lib/services/postService';
  import type { CalendarEvent } from '$lib/types/calendar';
  import CalendarDay from './CalendarDay.svelte';
  import CalendarWeek from './CalendarWeek.svelte';
  import CalendarMonth from './CalendarMonth.svelte';
  import CalendarHeader from './CalendarHeader.svelte';
  import CalendarSidebar from './CalendarSidebar.svelte';
  import PostEditor from './PostEditor.svelte';
  import CalendarLoading from './CalendarLoading.svelte';
  import { fade } from 'svelte/transition';

  export let openCreateModal: (date?: Date) => void;

  // Subscribe to data
  let unsubscribePosts: () => void;
  let unsubscribeEvents: () => void;
  let isLoading = true;

  // Track mouse position for drag preview
  let mouseX = 0;
  let mouseY = 0;
  
  const updateMousePosition = (event: MouseEvent) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  };

  // Handle date click for creating new posts
  function handleDateClick(date: Date) {
    openCreateModal(date);
  }

  onMount(() => {
    // Subscribe to posts data
    unsubscribePosts = subscribeToPosts();
    
    // Subscribe to derived calendar events
    unsubscribeEvents = subscribeToCalendarEvents();
    
    // Set loading to false after data has loaded
    const unsubscribeLoading = loadingPosts.subscribe(value => {
      // Add a small delay to ensure UI transitions are smooth
      if (!value) {
        setTimeout(() => {
          isLoading = false;
        }, 500);
      } else {
        isLoading = true;
      }
    });
    
    return () => {
      unsubscribeLoading();
    };
  });

  onDestroy(() => {
    if (unsubscribePosts) unsubscribePosts();
    if (unsubscribeEvents) unsubscribeEvents();
  });

  // Handle drag end events
  const handleDragEnd = (event: DragEvent, calendarEvent: CalendarEvent) => {
    const element = event.target as HTMLElement;
    element.style.opacity = '1';
  };
</script>

<svelte:window on:mousemove={updateMousePosition} />

<div class="flex h-screen flex-col bg-gray-50">
  <!-- Show loading state -->
  {#if isLoading}
    <div in:fade={{ duration: 200 }} out:fade={{ duration: 200 }}>
      <CalendarLoading />
    </div>
  {:else}
    <div class="flex h-full flex-col">
      <!-- Calendar Header with navigation and view controls -->
      <CalendarHeader 
        date={$calendarViewState.currentDate} 
        view={$calendarViewState.currentView}
        {navigateToToday}
        {navigateToPrevious}
        {navigateToNext}
        {changeView}
      />
      
      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar with filters and quick add -->
        <CalendarSidebar />
        
        <!-- Main calendar area -->
        <div class="flex-1 overflow-auto p-4">
          <div class="bg-white rounded-lg shadow-md h-full">
            {#if $calendarViewState.currentView === 'day'}
              <CalendarDay 
                date={$calendarViewState.currentDate} 
                events={$filteredEvents}
                {selectEvent}
                {startDrag}
                {handleDrop}
                onTimeClick={handleDateClick}
              />
            {:else if $calendarViewState.currentView === 'week'}
              <CalendarWeek 
                startDate={$calendarViewState.currentDate} 
                events={$filteredEvents}
                {selectEvent}
                {startDrag}
                {handleDrop}
                onTimeClick={handleDateClick}
              />
            {:else}
              <CalendarMonth 
                date={$calendarViewState.currentDate} 
                events={$filteredEvents}
                {selectEvent}
                {startDrag}
                {handleDrop}
                onDayClick={handleDateClick}
              />
            {/if}
          </div>
        </div>
        
        <!-- Post editor sidebar when an event is selected -->
        {#if $calendarViewState.selectedEvent && $calendarViewState.selectedPost}
          <div class="w-1/4 border-l border-gray-200 overflow-auto">
            <PostEditor 
              post={$calendarViewState.selectedPost} 
              onClose={clearSelection} 
            />
          </div>
        {/if}
      </div>
      
      <!-- Drag preview that follows mouse when dragging -->
      {#if $calendarViewState.draggedEvent}
        <div 
          class="fixed pointer-events-none z-50 bg-white rounded shadow-md px-2 py-1 border-l-4"
          style="left: {mouseX + 10}px; top: {mouseY + 10}px; border-left-color: {$calendarViewState.draggedEvent.platformColor};"
        >
          <p class="text-xs font-medium truncate max-w-xs">
            {$calendarViewState.draggedEvent.title}
          </p>
          <p class="text-xs text-gray-500">
            {$calendarViewState.draggedEvent.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
      {/if}
      
      <!-- Add post button (fixed) -->
      <button 
        class="fixed right-6 bottom-6 z-30 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700"
        on:click={() => openCreateModal()}
        aria-label="Create New Post"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  {/if}
</div>