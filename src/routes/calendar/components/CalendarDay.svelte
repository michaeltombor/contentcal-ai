<!-- src/routes/calendar/components/CalendarDay.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { CalendarEvent } from '$lib/types/calendar';
  
  // Props
  export let date: Date;
  export let events: CalendarEvent[] = [];
  export let selectEvent: (event: CalendarEvent) => void = () => {};
  export let startDrag: (event: CalendarEvent) => void = () => {};
  export let handleDrop: (date: Date, allDay: boolean) => void = () => {};
  export let onTimeClick: (date: Date) => void = () => {};
  
  // Create time slots from 8 AM to 8 PM
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
  
  // Filter events for this day
  $: todayEvents = events.filter(event => 
    event.start.toDateString() === date.toDateString()
  );
  
  // Group events by hour
  $: eventsByHour = groupEventsByHour(todayEvents);
  
  // Format date
  $: formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  
  // Handle time slot click
  function handleTimeSlotClick(hour: number) {
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    onTimeClick(newDate);
  }
  
  // Handle drop on time slot
  function handleTimeSlotDrop(event: DragEvent, hour: number) {
    event.preventDefault();
    
    const dropDate = new Date(date);
    dropDate.setHours(hour, 0, 0, 0);
    handleDrop(dropDate, false);
  }
  
  // Handle drag over time slot
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }
  
  // Group events by their starting hour
  function groupEventsByHour(events: CalendarEvent[]): Record<number, CalendarEvent[]> {
    const result: Record<number, CalendarEvent[]> = {};
    
    // Initialize all hours with empty arrays
    for (const hour of hours) {
      result[hour] = [];
    }
    
    // Add events to their respective hours
    for (const event of events) {
      const hour = event.start.getHours();
      // Only add events that are in our display range (8 AM - 8 PM)
      if (hour >= 8 && hour <= 20) {
        if (!result[hour]) {
          result[hour] = [];
        }
        result[hour].push(event);
      }
    }
    
    return result;
  }
  
  // Handle event click
  function handleEventClick(event: CalendarEvent) {
    selectEvent(event);
  }
  
  // Start dragging an event
  function handleDragStart(event: DragEvent, calEvent: CalendarEvent) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', calEvent.id);
      event.dataTransfer.effectAllowed = 'move';
    }
    startDrag(calEvent);
  }
</script>

<div class="day-view h-full flex flex-col">
  <!-- Day header -->
  <div class="day-header p-4 border-b border-gray-200">
    <h2 class="text-xl font-semibold">{formattedDate}</h2>
  </div>
  
  <!-- Time slots -->
  <div class="time-slots flex-1 overflow-y-auto p-4">
    {#each hours as hour}
      <div 
        class="time-slot flex border-b border-gray-100 hover:bg-gray-50"
        on:click={() => handleTimeSlotClick(hour)}
        on:dragover={handleDragOver}
        on:drop={(e) => handleTimeSlotDrop(e, hour)}
      >
        <!-- Time label -->
        <div class="time-label w-24 py-3 pr-4 text-right text-gray-500">
          {hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
        </div>
        
        <!-- Events container -->
        <div class="events-container flex-1 min-h-[60px] py-1 pl-2">
          {#each eventsByHour[hour] || [] as event}
            <div 
              class="event p-1 mb-1 rounded text-sm cursor-pointer"
              style="background-color: {event.backgroundColor || '#e8f4fd'}; border-left: 3px solid {event.platformColor || '#2563eb'};"
              draggable="true"
              on:click={() => handleEventClick(event)}
              on:dragstart={(e) => handleDragStart(e, event)}
            >
              <div class="event-title font-medium">
                {event.title}
              </div>
              <div class="event-time text-xs text-gray-600">
                {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                {#if event.end}
                  - {event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>