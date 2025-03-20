<!-- src/routes/calendar/components/CalendarMonth.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CalendarEvent } from '$lib/types/calendar';
  
  // Props
  export let date: Date;
  export let events: CalendarEvent[] = [];
  export let selectEvent: (event: CalendarEvent) => void = () => {};
  export let startDrag: (event: CalendarEvent) => void = () => {};
  export let handleDrop: (date: Date, allDay: boolean) => void = () => {};
  export let onDayClick: (date: Date) => void = () => {};
  
  // Define local state
  let calendarDays: Date[] = [];
  
  // Reactive statements
  $: currentMonth = date.getMonth();
  $: currentYear = date.getFullYear();
  $: firstDay = new Date(currentYear, currentMonth, 1);
  $: lastDay = new Date(currentYear, currentMonth + 1, 0);
  
  // Generate days in month view
  $: {
    // Reset array
    calendarDays = [];
    
    // Get first day of the month and adjust for the start of the week (Sunday = 0)
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Add days from previous month to start the calendar on Sunday
    const prevMonthDays = firstDayOfWeek;
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      const day = new Date(currentYear, currentMonth - 1, prevMonthLastDate - i);
      calendarDays.push(day);
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(currentYear, currentMonth, i);
      calendarDays.push(day);
    }
    
    // Add days from next month to fill the remaining cells
    const totalDaysToShow = 42; // 6 rows of 7 days
    const nextMonthDays = totalDaysToShow - calendarDays.length;
    
    for (let i = 1; i <= nextMonthDays; i++) {
      const day = new Date(currentYear, currentMonth + 1, i);
      calendarDays.push(day);
    }
  }
  
  // Get events for a specific day
  function getEventsForDay(day: Date): CalendarEvent[] {
    return events.filter(event => 
      event.start.getFullYear() === day.getFullYear() &&
      event.start.getMonth() === day.getMonth() &&
      event.start.getDate() === day.getDate()
    );
  }
  
  // Check if date is today
  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  // Check if date is in the current month
  function isCurrentMonth(date: Date): boolean {
    return date.getMonth() === currentMonth;
  }
  
  // Handle day click
  function handleDayClick(day: Date) {
    onDayClick(day);
  }
  
  // Handle drop on day
  function handleDayDrop(event: DragEvent, day: Date) {
    event.preventDefault();
    handleDrop(day, true);
  }
  
  // Handle drag over day
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  
  // Handle event click
  function handleEventClick(event: MouseEvent, calEvent: CalendarEvent) {
    event.stopPropagation(); // Prevent day click
    selectEvent(calEvent);
  }
  
  // Start dragging an event
  function handleDragStart(event: DragEvent, calEvent: CalendarEvent) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', calEvent.id);
      event.dataTransfer.effectAllowed = 'move';
    }
    startDrag(calEvent);
  }
  
  // Week days headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<div class="month-view h-full flex flex-col">
  <!-- Week days header -->
  <div class="week-days grid grid-cols-7 border-b border-gray-200">
    {#each weekDays as day}
      <div class="week-day p-2 text-center text-sm font-medium text-gray-500">
        {day}
      </div>
    {/each}
  </div>
  
  <!-- Calendar grid -->
  <div class="calendar-grid flex-1 grid grid-cols-7 grid-rows-6">
    {#each calendarDays as day, index}
      <div 
        class="calendar-day p-1 border border-gray-100 relative overflow-hidden 
              {isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50 text-gray-400'}
              {isToday(day) ? 'today' : ''}"
        on:click={() => handleDayClick(day)}
        on:dragover={handleDragOver}
        on:drop={(e) => handleDayDrop(e, day)}
      >
        <!-- Day number -->
        <div class="day-number flex justify-between items-center">
          <span class="text-sm {isToday(day) ? 'today-number' : ''}">
            {day.getDate()}
          </span>
          
          <!-- Optional: Add indicator for events -->
          {#if getEventsForDay(day).length > 0}
            <span class="event-indicator bg-blue-500 rounded-full w-1.5 h-1.5"></span>
          {/if}
        </div>
        
        <!-- Events for the day -->
        <div class="day-events mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-20px)]">
          {#each getEventsForDay(day).slice(0, 3) as event}
            <div 
              class="event p-1 text-xs rounded cursor-pointer truncate"
              style="background-color: {event.backgroundColor || '#e8f4fd'}; border-left: 2px solid {event.platformColor || '#2563eb'};"
              draggable="true"
              on:click={(e) => handleEventClick(e, event)}
              on:dragstart={(e) => handleDragStart(e, event)}
            >
              {event.title}
            </div>
          {/each}
          
          <!-- More indicator if there are more events -->
          {#if getEventsForDay(day).length > 3}
            <div class="more-events text-xs text-center text-gray-500">
              +{getEventsForDay(day).length - 3} more
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  /* Fixed the current day styling */
  .today {
    position: relative;
  }
  
  .today::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(59, 130, 246, 0.05);
    pointer-events: none;
    z-index: 0;
  }
  
  .today-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    width: 24px;
    border-radius: 50%;
    background-color: #3b82f6;
    color: white;
    font-weight: bold;
  }
  
  .day-events {
    position: relative;
    z-index: 1;
  }
</style>