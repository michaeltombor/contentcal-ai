<!-- src/routes/dashboard/recommendations/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/authStore';
  import { getRecommendedPostingTimes } from '$lib/services/recommendationService';
  import { goto } from '$app/navigation';
  
  let recommendations = [];
  let loading = true;
  let platform = 'twitter';
  let error = '';
  
  onMount(async () => {
    await fetchRecommendations();
  });
  
  async function fetchRecommendations() {
    loading = true;
    error = '';
    
    try {
      if (!$user) {
        error = 'You must be logged in to view recommendations.';
        return;
      }
      
      recommendations = await getRecommendedPostingTimes($user.uid, platform);
    } catch (e) {
      console.error('Error fetching recommendations:', e);
      error = 'Failed to load recommendations. Please try again.';
    } finally {
      loading = false;
    }
  }
  
  function schedulePosts(recommendation) {
    // Calculate the next date matching this day of week
    const today = new Date();
    const targetDay = recommendation.day;
    const daysToAdd = (targetDay + 7 - today.getDay()) % 7;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    targetDate.setHours(recommendation.hour, recommendation.minute, 0, 0);
    
    // Format the date and time for the URL parameters
    const formattedDate = targetDate.toISOString().split('T')[0];
    const formattedTime = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')}`;
    
    // Navigate to the create post page with pre-filled date and time
    goto(`/dashboard/create?date=${formattedDate}&time=${formattedTime}&platform=${platform}`);
  }
  
  function changePlatform() {
    fetchRecommendations();
  }
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-6">AI-Recommended Posting Times</h1>
  
  <div class="bg-white shadow rounded-lg p-6 mb-6">
    <div class="mb-4">
      <label for="platform" class="block text-sm font-medium text-gray-700 mb-2">Platform</label>
      <select
        id="platform"
        bind:value={platform}
        on:change={changePlatform}
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="twitter">Twitter/X</option>
        <option value="linkedin">LinkedIn (coming soon)</option>
        <option value="facebook">Facebook (coming soon)</option>
        <option value="instagram">Instagram (coming soon)</option>
      </select>
    </div>
    
    <p class="text-gray-600 mb-4">
      These posting time recommendations are based on your historical post performance and engagement patterns.
      The more you post, the more accurate these recommendations will become.
    </p>
    
    {#if loading}
      <div class="flex justify-center items-center py-12">
        <svg class="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    {:else if error}
      <div class="text-red-500 py-4">{error}</div>
    {:else if recommendations.length === 0}
      <div class="text-gray-500 py-4">No recommendations available.</div>
    {:else}
      <div class="space-y-4">
        {#each recommendations as recommendation, i}
          <div class="border rounded-lg p-4 bg-gray-50 flex justify-between items-center">
            <div>
              <div class="font-medium text-lg">{recommendation.formatted}</div>
              <div class="text-sm text-gray-500">
                Engagement Score: {Math.round(recommendation.score)}
                {#if i === 0}
                  <span class="ml-2 text-green-600 font-medium">★ Best Time</span>
                {/if}
              </div>
            </div>
            <button
              on:click={() => schedulePosts(recommendation)}
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Schedule Post
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <div class="bg-indigo-50 border border-indigo-100 rounded-lg p-6">
    <h2 class="text-lg font-medium text-indigo-800 mb-2">How These Recommendations Work</h2>
    <p class="text-indigo-700 mb-4">
      Our AI analyzes your post history and engagement patterns to determine the optimal times for you to post on each platform.
    </p>
    
    <h3 class="font-medium text-indigo-800 mb-1">The algorithm considers:</h3>
    <ul class="list-disc list-inside text-indigo-700 space-y-1 mb-4">
      <li>Your historical engagement rates</li>
      <li>Time of day and day of week patterns</li>
      <li>Platform-specific best practices</li>
      <li>Your audience's activity patterns</li>
    </ul>
    
    <p class="text-indigo-700">
      As you publish more content, these recommendations will become increasingly personalized and accurate.
    </p>
  </div>
</div>