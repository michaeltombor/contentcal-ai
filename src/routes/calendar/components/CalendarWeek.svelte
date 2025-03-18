<!-- src/routes/calendar/components/CalendarWeek.svelte -->
<script lang="ts">
  import type { CalendarEvent } from '$lib/types/calendar';
  
  export let startDate: Date;
  export let events: CalendarEvent[];
  export let selectEvent: (event: CalendarEvent) => void;
  export let startDrag: (event: CalendarEvent) => void;
  export let handleDrop: (date: Date, allDay: boolean) => Promise<void>;
  export let onTimeClick: (date: Date) => void;
  
  // Generate days for this week
  $: weekDays = generateWeekDays(startDate);
  
  // Generate time slots
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  
  // Format hour for display
  function formatHour(hour: number): string {
    return new Date(0, 0, 0, hour).toLocaleTimeString([], { 
      hour: 'numeric', 
      hour12: true 
    });
  }
  
  // Generate week days starting from startDate
  function generateWeekDays(start: Date): Date[] {
    const days = [];
    const startOfWeek = new Date(start);
    
    // Adjust to get the start of the week (Sunday)
    const diff = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    
    // Generate 7 days
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    
    return days;
  }
  
  // Filter events for a specific day
  function getEventsForDay(date: Date): CalendarEvent[] {
    return events.filter(event => 
      event.start.toDateString() === date.toDateString()
    );
  }
  
  // Get position for an event in the time grid
  function getEventPosition(event: CalendarEvent): { top: number, height: number } {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();
    
    const top = (startHour * 60 + startMinute) / 1440 * 100; // % of day
    const duration = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 1440 * 100; // % of day
    
    // Ensure minimum height for visibility
    const height = Math.max(duration, 1.5);
    
    return { top, height };
  }
  
  // Check if a date is today
  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
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
    
    // Stop event propagation
    event.stopPropagation();
  }
  
  // Handle drag end
  function handleDragEnd(event: DragEvent) {
    const element = event.target as HTMLElement;
    element.style.opacity = '1';
  }
  
  // Handle drag over for time slots
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    
    // Add visual feedback
    const element = event.currentTarget as HTMLElement;
    element.classList.add('bg-blue-50', 'border-blue-200');
  }
  
  // Handle drag leave for time slots
  function handleDragLeave(event: DragEvent) {
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('bg-blue-50', 'border-blue-200');
  }
  
  // Handle drop on a time slot
  async function onDrop(event: DragEvent, date: Date, hour: number) {
    event.preventDefault();
    
    // Remove highlight from drop zone
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('bg-blue-50', 'border-blue-200');
    
    // Calculate exact time based on mouse position
    const { hour: exactHour, minute } = getTimeFromMouseY(event, element);
    
    // Create new date for the drop
    const dropDate = new Date(date);
    dropDate.setHours(exactHour, minute, 0, 0);
    
    try {
      // Handle the drop through store function
      await handleDrop(dropDate, false);
      
      // Toast is handled in the handleDrop function
    } catch (error) {
      console.error('Error rescheduling:', error);
      // Error toast is handled in the handleDrop function
    }
  }
  
  // Calculate time from mouse Y position
  function getTimeFromMouseY(event: DragEvent | MouseEvent, element: HTMLElement): { hour: number, minute: number } {
    const rect = element.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const percentage = y / rect.height;
    
    // Convert percentage to hours and minutes
    const totalMinutes = percentage * 60;
    const hour = Math.floor(totalMinutes / 60) + parseInt(element.dataset.hour || '0');
    const minute = Math.round(totalMinutes % 60);
    
    return { hour: Math.min(Math.max(hour, 0), 23), minute };
  }
  
  // Handle click on time grid to create new event
  function handleTimeClick(event: MouseEvent, date: Date, hourBlock: number) {
    const target = event.currentTarget as HTMLElement;
    const { hour, minute } = getTimeFromMouseY(event, target);
    
    const clickDate = new Date(date);
    clickDate.setHours(hour, minute, 0, 0);
    
    onTimeClick(clickDate);
  }
</script>

<div class="h-full flex flex-col overflow-hidden">
  <!-- Week header with day names -->
  <div class="grid grid-cols-8 border-b">
    <div class="p-2 text-center text-sm font-medium text-gray-500 border-r">
      Time
    </div>
    {#each weekDays as day}
      <div class="p-2 text-center border-r last:border-r-0 {isToday(day) ? 'bg-blue-50' : ''}">
        <div class="text-sm font-medium">
          {day.toLocaleDateString(undefined, { weekday: 'short' })}
        </div>
        <div class="text-sm {isToday(day) ? 'font-bold text-blue-600' : 'text-gray-500'}">
          {day.getDate()}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- All-day section -->
  <div class="grid grid-cols-8 border-b">
    <div class="p-2 text-xs text-gray-500 border-r">All day</div>
    {#each weekDays as day}
      <div 
        class="p-1 min-h-10 border-r last:border-r-0 transition-colors {isToday(day) ? 'bg-blue-50' : ''}"
        on:dragover|preventDefault={handleDragOver}
        on:dragleave={handleDragLeave}
        on:drop|preventDefault={(e) => handleDrop(day, true)}
      >
        <!-- All day events would go here -->
      </div>
    {/each}
  </div>
  
  <!-- Time grid -->
  <div class="flex-1 overflow-y-auto">
    {#each HOURS as hour}
      <div class="grid grid-cols-8 border-b">
        <!-- Time label -->
        <div class="text-xs text-gray-500 text-right p-1 pr-2 border-r">
          {formatHour(hour)}
        </div>
        
        <!-- Day columns -->
        {#each weekDays as day, dayIndex}
          <div 
            class="relative h-16 border-r last:border-r-0 transition-colors {isToday(day) ? 'bg-blue-50/30' : ''}"
            on:dragover|preventDefault={handleDragOver}
            on:dragleave={handleDragLeave}
            on:drop={(e) => onDrop(e, day, hour)}
            on:click={(e) => handleTimeClick(e, day, hour)}
            data-hour={hour}
          >
            <!-- Events in this hour block -->
            {#each getEventsForDay(day) as event}
              {@const position = getEventPosition(event)}
              {#if position.top >= hour * (100/24) && position.top < (hour + 1) * (100/24)}
                <div 
                  class="absolute left-0 right-0 mx-1 rounded px-1 py-0.5 shadow-sm cursor-pointer overflow-hidden z-10 transition-opacity"
                  style="
                    top: {position.top % (100/24) / (100/24) * 100}%; 
                    height: {Math.min(position.height, (100/24) - (position.top % (100/24)) / (100/24) * 100)}%; 
                    background-color: {event.platformColor}20; 
                    border-left: 3px solid {event.platformColor};
                  "
                  draggable="true"
                  on:dragstart={(e) => handleDragStart(e, event)}
                  on:dragend={handleDragEnd}
                  on:click|stopPropagation={() => selectEvent(event)}
                >
                  <div class="text-xs font-medium truncate">{event.title}</div>
                  <div class="text-xs truncate">
                    {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>