<!-- src/routes/calendar/components/CalendarWeek.svelte -->
<script lang="ts">
  import type { CalendarEvent } from '$lib/types/calendar';
  
  export let startDate: Date;
  export let events: CalendarEvent[];
  export let selectEvent: (event: CalendarEvent) => void;
  export let startDrag: (event: CalendarEvent) => void;
  export let handleDrop: (date: Date, allDay: boolean) => Promise<void>;
  
  // Generate days for the week
  $: weekDays = generateWeekDays(startDate);
  // Filter events for the current week
  $: weekEvents = filterEventsByWeek(events, weekDays[0], weekDays[6]);
  // Group events by day for display
  $: eventsByDay = groupEventsByDay(weekEvents, weekDays);
  
  // Generate week days
  function generateWeekDays(startDate: Date): Date[] {
    // Find the start of the week (Sunday)
    const startOfWeek = new Date(startDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    // Generate days for the week
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    
    return days;
  }
  
  // Filter events for the current week
  function filterEventsByWeek(events: CalendarEvent[], startDay: Date, endDay: Date): CalendarEvent[] {
    // Set time to beginning and end of days
    const start = new Date(startDay);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDay);
    end.setHours(23, 59, 59, 999);
    
    return events.filter(event => 
      event.start >= start && event.start <= end
    );
  }
  
  // Group events by day for display
  function groupEventsByDay(events: CalendarEvent[], days: Date[]): Record<string, CalendarEvent[]> {
    const groupedEvents: Record<string, CalendarEvent[]> = {};
    
    // Initialize empty arrays for each day
    days.forEach(day => {
      groupedEvents[day.toDateString()] = [];
    });
    
    // Add events to appropriate days
    events.forEach(event => {
      const dayKey = event.start.toDateString();
      if (groupedEvents[dayKey]) {
        groupedEvents[dayKey].push(event);
      }
    });
    
    return groupedEvents;
  }
  
  // Generate time slots (1 hour intervals from 0:00 to 23:00)
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  
  // Format hour for display
  function formatHour(hour: number): string {
    return new Date(0, 0, 0, hour).toLocaleTimeString([], { 
      hour: 'numeric', 
      hour12: true 
    });
  }
  
  // Format day for display
  function formatDay(date: Date): string {
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      day: 'numeric' 
    });
  }
  
  // Check if date is today
  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  // Position events in the time grid
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
  function handleDragOver(event: DragEvent, date: Date, hour: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  
  // Handle drop on a time slot
  async function onDrop(event: DragEvent, date: Date, hour: number) {
    event.preventDefault();
    const dropDate = new Date(date);
    dropDate.setHours(hour, 0, 0, 0);
    await handleDrop(dropDate, false);
  }
  
  // Calculate time from mouse position for more precise drops
  function getTimeFromMouseY(event: MouseEvent, element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const percentage = y / rect.height;
    
    // Convert percentage to hours (0-24)
    return Math.floor(percentage * 24);
  }
</script>

<div class="flex flex-col h-full overflow-hidden">
  <!-- Day headers -->
  <div class="grid grid-cols-8 border-b">
    <!-- Time column header (empty) -->
    <div class="border-r p-2"></div>
    
    <!-- Day column headers -->
    {#each weekDays as day}
      <div class="p-2 text-center border-r {isToday(day) ? 'bg-blue-50' : ''}">
        <div class="font-medium">{formatDay(day)}</div>
      </div>
    {/each}
  </div>
  
  <!-- Week timeline with events -->
  <div class="flex-1 overflow-y-auto">
    <div class="grid grid-cols-8 min-h-full">
      <!-- Time labels -->
      <div class="border-r">
        {#each HOURS as hour}
          <div class="h-16 text-xs text-gray-500 text-right pr-2 -mt-2 border-b">
            {formatHour(hour)}
          </div>
        {/each}
      </div>
      
      <!-- Day columns with time slots and events -->
      {#each weekDays as day, dayIndex}
        <div class="relative border-r {isToday(day) ? 'bg-blue-50' : ''}">
          <!-- Hour grid lines -->
          {#each HOURS as hour}
            <div 
              class="h-16 border-b border-gray-200 relative"
              on:dragover={(e) => handleDragOver(e, day, hour)}
              on:drop={(e) => onDrop(e, day, hour)}
            ></div>
          {/each}
          
          <!-- Current time indicator -->
          {#if isToday(day)}
            {@const now = new Date()}
            {@const currentTimeTop = (now.getHours() * 60 + now.getMinutes()) / 1440 * 100}
            <div 
              class="absolute left-0 right-0 border-t-2 border-red-500 z-10"
              style="top: {currentTimeTop}%;"
            ></div>
          {/if}
          
          <!-- Events -->
          {#each eventsByDay[day.toDateString()] as event}
            {@const position = getEventPosition(event)}
            <div 
              class="absolute left-1 right-1 rounded px-1 py-px shadow-sm cursor-pointer overflow-hidden text-xs"
              style="
                top: {position.top}%; 
                height: {position.height}%; 
                background-color: {event.platformColor}20; 
                border-left: 3px solid {event.platformColor};
              "
              draggable="true"
              on:dragstart={(e) => handleDragStart(e, event)}
              on:click={() => selectEvent(event)}
            >
              <div class="font-medium truncate">{event.title}</div>
              <div class="text-xs truncate">
                {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>