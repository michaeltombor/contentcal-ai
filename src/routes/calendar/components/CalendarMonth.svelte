<!-- src/routes/calendar/components/CalendarMonth.svelte -->
<script lang="ts">
  import type { CalendarEvent } from '$lib/types/calendar';
  
  export let date: Date;
  export let events: CalendarEvent[];
  export let selectEvent: (event: CalendarEvent) => void;
  export let startDrag: (event: CalendarEvent) => void;
  export let handleDrop: (date: Date, allDay: boolean) => Promise<void>;
  
  // Days of the week
  const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate the calendar grid
  $: calendarDays = generateCalendarDays(date);
  
  // Group events by date for efficient lookup
  $: eventsByDate = groupEventsByDate(events);
  
  function generateCalendarDays(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Find the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    
    // Find the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Calculate days from previous month to show
    const daysFromPrevMonth = dayOfWeek;
    
    // Calculate days from next month to show (to complete 6 rows × 7 days grid)
    const totalDaysToShow = 42; // 6 rows × 7 days
    const daysFromNextMonth = totalDaysToShow - daysInMonth - daysFromPrevMonth;
    
    // Generate the days array
    const days: Date[] = [];
    
    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
      days.push(new Date(year, month - 1, i));
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month
    for (let i = 1; i <= daysFromNextMonth; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  }
  
  function groupEventsByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
    const groupedEvents: Record<string, CalendarEvent[]> = {};
    
    events.forEach(event => {
      const dateKey = event.start.toDateString();
      
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      
      groupedEvents[dateKey].push(event);
    });
    
    return groupedEvents;
  }
  
  function isCurrentMonth(day: Date): boolean {
    return day.getMonth() === date.getMonth();
  }
  
  function isToday(day: Date): boolean {
    const today = new Date();
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear();
  }
  
  // Handle drag events
  function handleDragStart(event: DragEvent, calendarEvent: CalendarEvent) {
    const element = event.target as HTMLElement;
    element.style.opacity = '0.5';
    
    // Store the event data
    startDrag(calendarEvent);
    
    // Set minimal data for HTML5 drag-drop API
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', calendarEvent.id);
    }
  }
  
  // Handle drag over for drop zones
  function handleDragOver(event: DragEvent, day: Date) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  
  // Handle drop on a day
  async function onDrop(event: DragEvent, day: Date) {
    event.preventDefault();
    await handleDrop(day, true);
  }
  
  // Get max visible events per day (3 for desktop, 2 for smaller screens)
  let maxVisibleEvents = 3;
  
  // Handle window resize for responsive design
  function updateMaxVisibleEvents() {
    maxVisibleEvents = window.innerWidth < 768 ? 2 : 3;
  }
</script>

<svelte:window on:resize={updateMaxVisibleEvents} />

<div class="flex flex-col h-full">
  <!-- Calendar Header -->
  <div class="grid grid-cols-7 text-center border-b border-gray-200">
    {#each DAYS_OF_WEEK as day}
      <div class="py-2 font-medium text-sm text-gray-800">{day}</div>
    {/each}
  </div>
  
  <!-- Calendar Days Grid -->
  <div class="grid grid-cols-7 flex-1 auto-rows-fr">
    {#each calendarDays as day, index}
      <div 
        class="border border-gray-100 relative min-h-[100px] p-1 {isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50'}"
        on:dragover={(e) => handleDragOver(e, day)}
        on:drop={(e) => onDrop(e, day)}
      >
        <!-- Day Number -->
        <div 
          class="text-sm font-medium {isToday(day) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : isCurrentMonth(day) ? 'text-gray-800' : 'text-gray-400'} mb-1"
        >
          {day.getDate()}
        </div>
        
        <!-- Events for this day -->
        <div class="space-y-1 overflow-hidden">
          {#if eventsByDate[day.toDateString()]}
            {#each eventsByDate[day.toDateString()].slice(0, maxVisibleEvents) as event, eventIndex}
              <div 
                class="text-xs p-1 rounded truncate cursor-pointer"
                style="background-color: {event.platformColor}20; border-left: 3px solid {event.platformColor};"
                draggable="true"
                on:dragstart={(e) => handleDragStart(e, event)}
                on:click={() => selectEvent(event)}
              >
                <div class="flex items-center">
                  <span class="font-medium truncate text-gray-800">{event.title}</span>
                </div>
                <div class="text-xs text-gray-600">
                  {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            {/each}
            
            <!-- Show +X more if there are additional events -->
            {#if eventsByDate[day.toDateString()].length > maxVisibleEvents}
              <div class="text-xs text-gray-500 pl-1">
                +{eventsByDate[day.toDateString()].length - maxVisibleEvents} more
              </div>
            {/if}
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>