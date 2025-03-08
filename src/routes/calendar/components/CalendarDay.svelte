<!-- src/routes/calendar/components/CalendarDay.svelte -->
<script lang="ts">
  import type { CalendarEvent } from '$lib/types/calendar';
  
  export let date: Date;
  export let events: CalendarEvent[];
  export let selectEvent: (event: CalendarEvent) => void;
  export let startDrag: (event: CalendarEvent) => void;
  export let handleDrop: (date: Date, allDay: boolean) => Promise<void>;
  
  // Filter events for the current day
  $: dayEvents = events.filter(event => 
    event.start.toDateString() === date.toDateString()
  );
  
  // Generate time slots (1 hour intervals from 0:00 to 23:00)
  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  
  // Format hour for display
  function formatHour(hour: number): string {
    return new Date(0, 0, 0, hour).toLocaleTimeString([], { 
      hour: 'numeric', 
      hour12: true 
    });
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
    const height = Math.max(duration, 2);
    
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
  function handleDragOver(event: DragEvent, hour: number, minute: number = 0) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  
  // Handle drop on a time slot
  async function onDrop(event: DragEvent, hour: number, minute: number = 0) {
    event.preventDefault();
    const dropDate = new Date(date);
    dropDate.setHours(hour, minute, 0, 0);
    await handleDrop(dropDate, false);
  }
  
  // Calculate Y coordinate from mouse event for more precise drops
  function getTimeFromMouseY(event: MouseEvent, element: HTMLElement): { hour: number, minute: number } {
    const rect = element.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const percentage = y / rect.height;
    
    // Convert percentage to hours and minutes (24 hours = 1440 minutes)
    const totalMinutes = percentage * 1440;
    const hour = Math.floor(totalMinutes / 60);
    const minute = Math.round(totalMinutes % 60);
    
    return { hour, minute };
  }
  
  // Handle click on time grid to allow event creation at specific time
  function onTimeGridClick(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const { hour, minute } = getTimeFromMouseY(event, target);
    
    // TODO: Create new event at this time
    console.log(`Create event at ${hour}:${minute}`);
  }
</script>

<div class="flex flex-col h-full overflow-hidden">
  <!-- Header with day name and date -->
  <div class="p-4 border-b text-center">
    <h2 class="text-xl font-semibold">
      {date.toLocaleDateString(undefined, { weekday: 'long' })}
    </h2>
    <p class="text-gray-500">
      {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
    </p>
  </div>
  
  <!-- Day timeline with events -->
  <div class="flex flex-1 overflow-y-auto">
    <!-- Time labels -->
    <div class="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50">
      {#each HOURS as hour}
        <div class="h-16 text-xs text-gray-500 text-right pr-2 -mt-2">
          {formatHour(hour)}
        </div>
      {/each}
    </div>
    
    <!-- Time grid with events -->
    <div 
      class="flex-1 relative"
      on:click={onTimeGridClick}
    >
      <!-- Hour grid lines -->
      {#each HOURS as hour}
        <div 
          class="h-16 border-b border-gray-200 relative"
          on:dragover={(e) => handleDragOver(e, hour)}
          on:drop={(e) => onDrop(e, hour)}
        ></div>
      {/each}
      
      <!-- Current time indicator -->
      {#if date.toDateString() === new Date().toDateString()}
        {@const now = new Date()}
        {@const currentTimeTop = (now.getHours() * 60 + now.getMinutes()) / 1440 * 100}
        <div 
          class="absolute left-0 right-0 border-t-2 border-red-500 z-10"
          style="top: {currentTimeTop}%;"
        >
          <div class="absolute -top-2 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
      {/if}
      
      <!-- Events -->
      {#each dayEvents as event}
        {@const position = getEventPosition(event)}
        <div 
          class="absolute left-1 right-1 rounded p-2 shadow-sm cursor-pointer overflow-hidden"
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
          <div class="text-sm font-medium truncate">{event.title}</div>
          <div class="text-xs">
            {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
            {event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>