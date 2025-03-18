<!-- src/routes/calendar/components/Calendar.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    calendarViewState, 
    filteredEvents
  } from '$lib/stores/calendarStore';
  import { 
    postStore,
    postStoreLoading
  } from '$lib/stores/postStore';
  import type { CalendarEvent } from '$lib/types/calendar';
  import CalendarDay from './CalendarDay.svelte';
  import CalendarWeek from './CalendarWeek.svelte';
  import CalendarMonth from './CalendarMonth.svelte';
  import CalendarHeader from './CalendarHeader.svelte';
  import CalendarSidebar from './CalendarSidebar.svelte';
  import PostEditor from './PostEditor.svelte';
  import CalendarLoading from './CalendarLoading.svelte';
  import ToastContainer from '$lib/components/common/ToastContainer.svelte';
  import { fade } from 'svelte/transition';

  export let openCreateModal: (date?: Date) => void;

  // Loading state
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
  
  // Handle the add button click
  function handleAddButtonClick() {
    // Call the openCreateModal function with current date
    openCreateModal(new Date());
  }
  
  // Direct implementation of the functions to avoid import issues
  
  // Select event function
  function localSelectEvent(event: CalendarEvent) {
    calendarViewState.set({
      ...$calendarViewState,
      selectedEvent: event,
      // Find and select the corresponding post
      selectedPost: $postStore.posts.find(post => post.id === event.postId)
    });
  }
  
  // Clear selection function
  function localClearSelection() {
    calendarViewState.set({
      ...$calendarViewState,
      selectedEvent: undefined,
      selectedPost: undefined
    });
  }
  
  // Start drag function
  function localStartDrag(event: CalendarEvent) {
    calendarViewState.set({
      ...$calendarViewState,
      draggedEvent: event
    });
  }
  
  // End drag function
  function localEndDrag() {
    calendarViewState.set({
      ...$calendarViewState,
      draggedEvent: undefined
    });
  }
  
  // Handle drop function
  async function localHandleDrop(date: Date, allDay: boolean = false) {
    const state = $calendarViewState;
    if (!state.draggedEvent) return;

    try {
      // Calculate new time while preserving hours and minutes if not all day
      const newDate = new Date(date);
      if (!allDay) {
        const originalDate = state.draggedEvent.start;
        newDate.setHours(originalDate.getHours());
        newDate.setMinutes(originalDate.getMinutes());
      } else {
        // If dropped as all-day event, set to beginning of day
        newDate.setHours(9, 0, 0, 0); // Default to 9 AM
      }

      // Use the postStore reschedulePost function
      await postStore.reschedulePost(state.draggedEvent.postId, newDate);
      
      // Show success toast if you have a toast system
      // toastStore.success('Post rescheduled successfully');

      localEndDrag();
    } catch (error) {
      console.error('Error handling drop:', error);
      // Show error toast if you have a toast system
      // toastStore.error('Failed to reschedule post');
    }
  }
  
  // Handle window drag events to ensure we clean up on drop outside
  function handleWindowDragOver(event: DragEvent) {
    // Allow dropping anywhere in the window
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  
  function handleWindowDrop(event: DragEvent) {
    // If dropped outside a valid drop zone, cancel the drag operation
    event.preventDefault();
    localEndDrag();
  }

  // Dummy functions to pass to CalendarHeader (it now handles these internally)
  const dummyNavigate = () => {};
  const dummyChangeView = (_view: any) => {};

  onMount(() => {
    // Load posts if not already loaded
    if (!$postStore.loading && $postStore.posts.length === 0) {
      postStore.loadPosts();
    }
    
    // Set loading to false after data has loaded
    const unsubscribeLoading = postStoreLoading.subscribe(loading => {
      // Add a small delay to ensure UI transitions are smooth
      if (!loading) {
        setTimeout(() => {
          isLoading = false;
        }, 500);
      } else {
        isLoading = true;
      }
    });
    
    // Add event listeners for global drag and drop
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    
    return () => {
      if (unsubscribeLoading) unsubscribeLoading();
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  });
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
        navigateToToday={dummyNavigate}
        navigateToPrevious={dummyNavigate}
        navigateToNext={dummyNavigate}
        changeView={dummyChangeView}
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
                selectEvent={localSelectEvent}
                startDrag={localStartDrag}
                handleDrop={localHandleDrop}
                onTimeClick={handleDateClick}
              />
            {:else if $calendarViewState.currentView === 'week'}
              <CalendarWeek 
                startDate={$calendarViewState.currentDate} 
                events={$filteredEvents}
                selectEvent={localSelectEvent}
                startDrag={localStartDrag}
                handleDrop={localHandleDrop}
                onTimeClick={handleDateClick}
              />
            {:else}
              <CalendarMonth 
                date={$calendarViewState.currentDate} 
                events={$filteredEvents}
                selectEvent={localSelectEvent}
                startDrag={localStartDrag}
                handleDrop={localHandleDrop}
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
              onClose={localClearSelection} 
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
        on:click={handleAddButtonClick}
        aria-label="Create New Post"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  {/if}
</div>