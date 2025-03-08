<!-- src/routes/calendar/components/CalendarHeader.svelte -->
<script lang="ts">
  export let date: Date;
  export let view: 'day' | 'week' | 'month';
  export let navigateToToday: () => void;
  export let navigateToPrevious: () => void;
  export let navigateToNext: () => void;
  export let changeView: (view: 'day' | 'week' | 'month') => void;
  
  // Format header title based on current view
  $: title = formatHeaderTitle(date, view);
  
  function formatHeaderTitle(date: Date, view: string): string {
    if (view === 'day') {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } else if (view === 'week') {
      // Get the start and end of the week
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      // Format the date range
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        // Same month
        return `${startOfWeek.toLocaleDateString(undefined, { month: 'long' })} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
        // Different months, same year
        return `${startOfWeek.toLocaleDateString(undefined, { month: 'short' })} ${startOfWeek.getDate()} - ${endOfWeek.toLocaleDateString(undefined, { month: 'short' })} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else {
        // Different years
        return `${startOfWeek.toLocaleDateString(undefined, { month: 'short' })} ${startOfWeek.getDate()}, ${startOfWeek.getFullYear()} - ${endOfWeek.toLocaleDateString(undefined, { month: 'short' })} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
      }
    } else {
      // Month view
      return date.toLocaleDateString(undefined, { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  }
</script>

<header class="bg-white border-b p-4 sticky top-0 z-20">
  <div class="max-w-full mx-auto">
    <div class="flex items-center justify-between">
      <!-- Title and Navigation -->
      <div class="flex items-center space-x-4">
        <h1 class="text-xl font-bold">{title}</h1>
        
        <div class="flex items-center space-x-2">
          <button 
            class="p-2 rounded-full hover:bg-gray-100" 
            on:click={navigateToPrevious}
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <button 
            class="p-2 rounded-full hover:bg-gray-100" 
            on:click={navigateToNext}
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <button 
            class="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100" 
            on:click={navigateToToday}
          >
            Today
          </button>
        </div>
      </div>
      
      <!-- View Controls -->
      <div class="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
        <button 
          class="px-3 py-1 text-sm rounded-md {view === 'day' ? 'bg-white shadow text-blue-600' : 'hover:bg-gray-200'}" 
          on:click={() => changeView('day')}
        >
          Day
        </button>
        <button 
          class="px-3 py-1 text-sm rounded-md {view === 'week' ? 'bg-white shadow text-blue-600' : 'hover:bg-gray-200'}" 
          on:click={() => changeView('week')}
        >
          Week
        </button>
        <button 
          class="px-3 py-1 text-sm rounded-md {view === 'month' ? 'bg-white shadow text-blue-600' : 'hover:bg-gray-200'}" 
          on:click={() => changeView('month')}
        >
          Month
        </button>
      </div>
      
      <!-- Create Event Button -->
      <button 
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Post
      </button>
    </div>
  </div>
</header>