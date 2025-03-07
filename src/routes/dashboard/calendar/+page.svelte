<!-- src/routes/dashboard/calendar/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/authStore';
  import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
  import { db } from '$lib/firebase/firebase';
  import { goto } from '$app/navigation';
  import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
  
  let currentMonth = new Date();
  let calendarDays = [];
  let scheduledPosts = [];
  let loading = true;
  
  $: if (currentMonth) {
    generateCalendarDays();
  }
  
  onMount(async () => {
    await fetchPosts();
  });
  
  function generateCalendarDays() {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Get all days in the month
    calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add days from previous and next month to fill calendar grid
    const firstDayOfMonth = monthStart.getDay(); // 0-6, where 0 is Sunday
    const lastDayOfMonth = monthEnd.getDay();
    
    // Add days from previous month
    const prevMonthEnd = new Date(monthStart);
    prevMonthEnd.setDate(0); // Last day of previous month
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = new Date(prevMonthEnd);
      day.setDate(prevMonthEnd.getDate() - i);
      calendarDays = [day, ...calendarDays];
    }
    
    // Add days from next month
    const nextMonthStart = new Date(monthEnd);
    nextMonthStart.setDate(nextMonthStart.getDate() + 1);
    for (let i = 1; i < (7 - lastDayOfMonth); i++) {
      const day = new Date(nextMonthStart);
      day.setDate(nextMonthStart.getDate() + (i - 1));
      calendarDays = [...calendarDays, day];
    }
  }
  
  async function fetchPosts() {
    loading = true;
    try {
      if (!$user) return;
      
      // Query posts for the current user that are scheduled
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', $user.uid),
        where('status', '==', 'scheduled'),
        orderBy('scheduledAt')
      );
      
      const querySnapshot = await getDocs(postsQuery);
      scheduledPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledAt: doc.data().scheduledAt?.toDate() // Convert Firestore timestamp to JS Date
      }));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      loading = false;
    }
  }
  
  function prevMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    fetchPosts();
  }
  
  function nextMonth() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    fetchPosts();
  }
  
  function getPostsForDay(day) {
    return scheduledPosts.filter(post => post.scheduledAt && isSameDay(post.scheduledAt, day));
  }
  
  function addNewPost() {
    goto('/dashboard/create');
  }
  
  function viewPost(id) {
    goto(`/dashboard/posts/${id}`);
  }
  
  function isCurrentMonth(day) {
    return day.getMonth() === currentMonth.getMonth();
  }
  
  function isToday(day) {
    return isSameDay(day, new Date());
  }
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold">Content Calendar</h1>
    <button
      on:click={addNewPost}
      class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      Create New Post
    </button>
  </div>
  
  <div class="bg-white shadow rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
      <div class="flex space-x-2">
        <button
          on:click={prevMonth}
          class="p-1 hover:bg-gray-100 rounded-full"
          aria-label="Previous month"
        >
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          on:click={nextMonth}
          class="p-1 hover:bg-gray-100 rounded-full"
          aria-label="Next month"
        >
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
    
    <div class="grid grid-cols-7 gap-px">
      {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
        <div class="text-center font-medium text-gray-500 p-2">{day}</div>
      {/each}
      
      {#each calendarDays as day}
        <div 
          class="p-2 min-h-[100px] border rounded hover:bg-gray-50 transition {isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50 text-gray-400'} {isToday(day) ? 'ring-2 ring-indigo-500' : ''}"
        >
          <div class="text-right mb-1">
            {format(day, 'd')}
          </div>
          
          {#if loading}
            <div class="flex justify-center items-center h-16">
              <svg class="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          {:else}
            <div class="space-y-1">
              {#each getPostsForDay(day) as post}
                <div 
                  class="p-1 text-xs bg-indigo-100 text-indigo-800 rounded truncate cursor-pointer hover:bg-indigo-200"
                  on:click={() => viewPost(post.id)}
                >
                  <div class="flex items-center">
                    <span class="w-2 h-2 bg-indigo-500 rounded-full mr-1"></span>
                    <span>{format(post.scheduledAt, 'h:mm a')}</span>
                  </div>
                  <div class="truncate">{post.content.substring(0, 30)}...</div>
                </div>
              {/each}
              
              {#if isCurrentMonth(day) && getPostsForDay(day).length === 0}
                <button 
                  on:click={addNewPost}
                  class="w-full p-1 text-xs text-gray-500 hover:text-indigo-600 text-center"
                >
                  + Add post
                </button>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>