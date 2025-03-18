<!-- src/routes/calendar/components/CalendarMonth.svelte -->
<script lang="ts">
  import type { CalendarEvent } from '$lib/types/calendar';
  
  export let date: Date;
  export let events: CalendarEvent[];
  export let selectEvent: (event: CalendarEvent) => void;
  export let startDrag: (event: CalendarEvent) => void;
  export let handleDrop: (date: Date, allDay: boolean) => Promise<void>;
  export let onDayClick: (date: Date) => void;
  
  // Current month/year info
  $: year = date.getFullYear();
  $: month = date.getMonth();
  $: monthName = date.toLocaleString('default', { month: 'long' });
  
  // Get the first day of the month
  $: firstDay = new Date(year, month, 1);
  
  // Get the last day of the month
  $: lastDay = new Date(year, month + 1, 0);
  
  // Get the number of days in the month
  $: daysInMonth = lastDay.getDate();
  
  // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
  $: firstDayOfWeek = firstDay.getDay();
  
  // Calculate the number of days to display from the previous month
  $: daysFromPrevMonth = firstDayOfWeek;
  
  // Calculate total number of days to display (including days from previous and next month)
  $: totalDays = daysFromPrevMonth + daysInMonth + (42 - daysFromPrevMonth - daysInMonth);
  
  // Generate an array of days to render
  $: calendarDays = generateCalendarDays();
  
  function generateCalendarDays() {
    const days = [];
    let dayCounter = 1 - daysFromPrevMonth;
    
    for (let i = 0; i < 6; i++) { // 6 weeks
      const week = [];
      
      for (let j = 0; j < 7; j++) { // 7 days per week
        const currentDate = new Date(year, month, dayCounter);
        const isCurrentMonth = currentDate.getMonth() === month;
        
        // Get events for this day
        const dayEvents = events.filter(event => 
          event.start.getDate() === currentDate.getDate() &&
          event.start.getMonth() === currentDate.getMonth() &&
          event.start.getFullYear() === currentDate.getFullYear()
        );
        
        week.push({
          date: currentDate,
          day: currentDate.getDate(),
          isCurrentMonth,
          isToday: isToday(currentDate),
          events: dayEvents
        });
        
        dayCounter++;
      }
      
      days.push(week);
      
      // If we've rendered all the days (including padding from next month), stop
      if (dayCounter > daysInMonth && (dayCounter - 1 - daysInMonth) % 7 === 0) {
        break;
      }
    }
    
    return days;
  }
  
  // Check if a date is today
  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  // Days of the week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get a shortened event display (max 2 events per cell)
  function getVisibleEvents(dayEvents: CalendarEvent[]) {
    const MAX_VISIBLE = 3;
    const visibleEvents = dayEvents.slice(0, MAX_VISIBLE);
    const hiddenCount = dayEvents.length - MAX_VISIBLE;
    
    return {
      visible: visibleEvents,
      hiddenCount: hiddenCount > 0 ? hiddenCount : 0
    };
  }
  
  // Handle drag events
  function handleDragStart(event: DragEvent, calendarEvent: CalendarEvent) {
    if (!event.dataTransfer) return;
    
    const element = event.target as HTMLElement;
    element.style.opacity = '0.5';
    
    // Set visual drag effect
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', calendarEvent.id);
    
    // Store the event data in store
    startDrag(calendarEvent);
    
    // Stop propagation to prevent opening the day when starting a drag
    event.stopPropagation();
  }
  
  // Handle drag end
  function handleDragEnd(event: DragEvent) {
    const element = event.target as HTMLElement;
    element.style.opacity = '1';
  }
  
  // Handle drag over for day cells
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    
    // Add visual feedback
    const element = event.currentTarget as HTMLElement;
    element.classList.add('bg-blue-50');
  }
  
  // Handle drag leave for day cells
  function handleDragLeave(event: DragEvent) {
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('bg-blue-50');
  }
  
  // Handle drop on a day cell
  async function onDropDay(event: DragEvent, date: Date) {
    event.preventDefault();
    
    // Remove highlight from drop zone
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('bg-blue-50');
    
    try {
      // Handle the drop through store function
      await handleDrop(date, true);
      
      // Toast is handled in the handleDrop function
    } catch (error) {
      console.error('Error rescheduling:', error);
      // Error toast is handled in the handleDrop function
    }
  }
</script>

<div class="h-full flex flex-col overflow-hidden">
  <!-- Calendar header with day names -->
  <div class="grid grid-cols-7 border-b">
    {#each daysOfWeek as day}
      <div class="p-2 text-center text-sm font-medium text-gray-500">
        {day}
      </div>
    {/each}
  </div>
  
  <!-- Calendar grid with days -->
  <div class="flex-1 overflow-y-auto">
    {#each calendarDays as week}
      <div class="grid grid-cols-7 border-b">
        {#each week as day}
          {@const eventData = getVisibleEvents(day.events)}
          <div 
            class="min-h-32 p-1 border-r last:border-r-0 transition-colors {
              day.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
            } {
              day.isToday ? 'border-l-2 border-l-blue-500' : ''
            }"
            on:dragover={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={(e) => onDropDay(e, day.date)}
            on:click={() => onDayClick(day.date)}
          >
            <!-- Day number -->
            <div class="text-right mb-1">
              <span class="text-sm {day.isToday ? 'font-bold text-blue-600' : 'font-medium'}">
                {day.day}
              </span>
            </div>
            
            <!-- Events -->
            <div class="space-y-1">
              {#each eventData.visible as event}
                <div 
                  class="text-xs p-1 rounded overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer"
                  style="background-color: {event.platformColor}20; border-left: 2px solid {event.platformColor};"
                  draggable="true"
                  on:dragstart={(e) => handleDragStart(e, event)}
                  on:dragend={handleDragEnd}
                  on:click|stopPropagation={() => selectEvent(event)}
                >
                  {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} {event.title}
                </div>
              {/each}
              
              {#if eventData.hiddenCount > 0}
                <div class="text-xs text-gray-500 text-center pt-1">
                  + {eventData.hiddenCount} more
                </div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>