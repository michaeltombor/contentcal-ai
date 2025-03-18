<!-- src/routes/calendar/components/CalendarHeader.svelte -->
<script lang="ts">
  // Instead of using the functions passed as props, we'll directly import and use the store
  import { calendarViewState } from '$lib/stores/calendarStore';
  
  export let date: Date;
  export let view: 'day' | 'week' | 'month';
  
  // Define these props but we won't use them (to maintain compatibility)
  export let navigateToToday: () => void;
  export let navigateToPrevious: () => void;
  export let navigateToNext: () => void;
  export let changeView: (view: 'day' | 'week' | 'month') => void;
  
  // Local functions that directly update the store
  function localNavigateToToday() {
    calendarViewState.set({
      ...$calendarViewState,
      currentDate: new Date()
    });
  }
  
  function localNavigateToPrevious() {
    const current = new Date(date);
    
    if (view === 'day') {
      current.setDate(current.getDate() - 1);
    } else if (view === 'week') {
      current.setDate(current.getDate() - 7);
    } else {
      current.setMonth(current.getMonth() - 1);
    }
    
    calendarViewState.set({
      ...$calendarViewState,
      currentDate: current
    });
  }
  
  function localNavigateToNext() {
    const current = new Date(date);
    
    if (view === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (view === 'week') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
    
    calendarViewState.set({
      ...$calendarViewState,
      currentDate: current
    });
  }
  
  function localChangeView(newView: 'day' | 'week' | 'month') {
    calendarViewState.set({
      ...$calendarViewState,
      currentView: newView
    });
  }
  
  // Format date for display
  $: formattedDate = formatDate(date, view);
  
  function formatDate(date: Date, viewType: string): string {
    if (viewType === 'day') {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    } else if (viewType === 'week') {
      const startOfWeek = new Date(date);
      const dayOfWeek = startOfWeek.getDay();
      startOfWeek.setDate(date.getDate() - dayOfWeek);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString(undefined, { month: 'long' })} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else {
        return `${startOfWeek.toLocaleDateString(undefined, { month: 'short' })} ${startOfWeek.getDate()} - ${endOfWeek.toLocaleDateString(undefined, { month: 'short' })} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
      }
    } else {
      return date.toLocaleDateString(undefined, { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  }
</script>

<div class="flex justify-between items-center py-3 px-4 border-b bg-white">
  <div class="flex items-center space-x-2">
    <button 
      class="p-1.5 rounded hover:bg-gray-100"
      on:click={localNavigateToPrevious}
      aria-label="Previous"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
    </button>
    
    <h2 class="text-xl font-medium">{formattedDate}</h2>
    
    <button 
      class="p-1.5 rounded hover:bg-gray-100"
      on:click={localNavigateToNext}
      aria-label="Next"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
      </svg>
    </button>
    
    <button 
      class="ml-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
      on:click={localNavigateToToday}
    >
      Today
    </button>
  </div>
  
  <div class="flex items-center space-x-2">
    <div class="bg-gray-100 rounded-md p-1 inline-flex">
      <button 
        class="px-3 py-1 text-sm rounded-md {view === 'day' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}"
        on:click={() => localChangeView('day')}
      >
        Day
      </button>
      <button 
        class="px-3 py-1 text-sm rounded-md {view === 'week' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}"
        on:click={() => localChangeView('week')}
      >
        Week
      </button>
      <button 
        class="px-3 py-1 text-sm rounded-md {view === 'month' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}"
        on:click={() => localChangeView('month')}
      >
        Month
      </button>
    </div>
  </div>
</div>