<!-- src/routes/calendar/components/CalendarLoading.svelte -->
<script lang="ts">
  // This component shows a loading state while the calendar data is being fetched
</script>

<div class="flex h-full w-full items-center justify-center bg-white">
  <div class="text-center">
    <div class="inline-block animate-spin h-8 w-8 border-4 border-gray-200 rounded-full border-t-blue-600 mb-4"></div>
    <p class="text-gray-600">Loading your calendar...</p>
  </div>
</div>