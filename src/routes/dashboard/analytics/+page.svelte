<!-- src/routes/dashboard/analytics/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/authStore';
  import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
  import { db } from '$lib/firebase/firebase';
  import { Line } from 'svelte-chartjs';
  import { Chart, Title, Tooltip, Legend, LinearScale, PointElement, LineElement, CategoryScale } from 'chart.js';
  import { subDays, format, parseISO } from 'date-fns';
  
  // Register Chart.js components
  Chart.register(Title, Tooltip, Legend, LinearScale, PointElement, LineElement, CategoryScale);
  
  let posts = [];
  let analytics = {};
  let loading = true;
  let timeRange = '7'; // Default to 7 days
  let error = '';
  let performanceData = null;
  let topPosts = [];
  let engagementRate = 0;
  let totalEngagements = 0;
  let totalImpressions = 0;
  
  $: if (!loading && posts.length > 0) {
    calculatePerformanceData();
  }
  
  onMount(async () => {
    await fetchPostsAndAnalytics();
  });
  
  async function fetchPostsAndAnalytics() {
    loading = true;
    error = '';
    
    try {
      if (!$user) {
        error = 'You must be logged in to view analytics.';
        return;
      }
      
      // Fetch posts for the current user that are published
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', $user.uid),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc')
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() // Convert Firestore timestamp to JS Date
      }));
      
      if (posts.length === 0) {
        loading = false;
        return;
      }
      
      // Get post IDs for analytics query
      const postIds = posts.map(post => post.id);
      
      // Fetch analytics for these posts
      const analyticsQuery = query(
        collection(db, 'postAnalytics'),
        where('postId', 'in', postIds)
      );
      
      const analyticsSnapshot = await getDocs(analyticsQuery);
      
      // Group analytics by post ID
      analytics = {};
      analyticsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!analytics[data.postId]) {
          analytics[data.postId] = [];
        }
        analytics[data.postId].push({
          id: doc.id,
          ...data,
          recordedAt: data.recordedAt?.toDate() // Convert Firestore timestamp to JS Date
        });
      });
      
      // Sort analytics by recorded date
      Object.keys(analytics).forEach(postId => {
        analytics[postId].sort((a, b) => a.recordedAt - b.recordedAt);
      });
      
      calculatePerformanceData();
    } catch (e) {
      console.error('Error fetching analytics:', e);
      error = 'Failed to load analytics. Please try again.';
    } finally {
      loading = false;
    }
  }
  
  function calculatePerformanceData() {
    // Filter posts based on selected time range
    const days = parseInt(timeRange);
    const startDate = subDays(new Date(), days);
    
    const filteredPosts = posts.filter(post => post.publishedAt >= startDate);
    
    // Calculate total engagements and impressions
    let totalEngage = 0;
    let totalImpression = 0;
    
    // Prepare data for the chart
    const dates = [];
    const engagements = [];
    const impressions = [];
    
    // Generate dates for the chart (last X days)
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      dates.push(format(date, 'MMM dd'));
      engagements.push(0);
      impressions.push(0);
    }
    
    // Sum up analytics for each day
    filteredPosts.forEach(post => {
      const postAnalytics = analytics[post.id] || [];
      
      postAnalytics.forEach(record => {
        if (record.recordedAt >= startDate) {
          // Add to totals
          totalEngage += record.engagements || 0;
          totalImpression += record.impressions || 0;
          
          // Add to daily counts for the chart
          const dayIndex = days - Math.floor((new Date() - record.recordedAt) / (1000 * 60 * 60 * 24));
          if (dayIndex >= 0 && dayIndex < dates.length) {
            engagements[dayIndex] += record.engagements || 0;
            impressions[dayIndex] += record.impressions || 0;
          }
        }
      });
    });
    
    // Calculate engagement rate
    engagementRate = totalImpression > 0 ? (totalEngage / totalImpression) * 100 : 0;
    totalEngagements = totalEngage;
    totalImpressions = totalImpression;
    
    // Prepare chart data
    performanceData = {
      labels: dates,
      datasets: [
        {
          label: 'Engagements',
          data: engagements,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          tension: 0.3
        },
        {
          label: 'Impressions',
          data: impressions,
          borderColor: 'rgb(14, 165, 233)',
          backgroundColor: 'rgba(14, 165, 233, 0.5)',
          tension: 0.3
        }
      ]
    };
    
    // Calculate top performing posts
    topPosts = filteredPosts
      .map(post => {
        const postAnalytics = analytics[post.id] || [];
        const totalPostEngagements = postAnalytics.reduce((sum, record) => sum + (record.engagements || 0), 0);
        const totalPostImpressions = postAnalytics.reduce((sum, record) => sum + (record.impressions || 0), 0);
        
        return {
          ...post,
          totalEngagements: totalPostEngagements,
          totalImpressions: totalPostImpressions,
          engagementRate: totalPostImpressions > 0 ? (totalPostEngagements / totalPostImpressions) * 100 : 0
        };
      })
      .sort((a, b) => b.totalEngagements - a.totalEngagements)
      .slice(0, 5);
  }
  
  function changeTimeRange() {
    calculatePerformanceData();
  }
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-6">Social Media Analytics</h1>
  
  {#if loading}
    <div class="flex justify-center items-center py-12">
      <svg class="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  {:else if error}
    <div class="text-red-500 py-4">{error}</div>
  {:else if posts.length === 0}
    <div class="bg-white shadow rounded-lg p-6 text-center">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <h2 class="text-xl font-medium text-gray-900 mb-2">No Analytics Data Available</h2>
      <p class="text-gray-500 mb-4">You haven't published any posts yet. Publish some content to see analytics.</p>
      <button
        on:click={() => goto('/dashboard/create')}
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Create New Post
      </button>
    </div>
  {:else}
    <div class="mb-6">
      <label for="timeRange" class="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
      <select
        id="timeRange"
        bind:value={timeRange}
        on:change={changeTimeRange}
        class="max-w-xs mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="7">Last 7 Days</option>
        <option value="14">Last 14 Days</option>
        <option value="30">Last 30 Days</option>
        <option value="90">Last 3 Months</option>
      </select>
    </div>
    
    <!-- Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-sm font-medium text-gray-500 truncate">Total Engagements</h2>
        <div class="mt-2 flex items-baseline">
          <div class="text-2xl font-semibold text-gray-900">{totalEngagements.toLocaleString()}</div>
        </div>
      </div>
      
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-sm font-medium text-gray-500 truncate">Total Impressions</h2>
        <div class="mt-2 flex items-baseline">
          <div class="text-2xl font-semibold text-gray-900">{totalImpressions.toLocaleString()}</div>
        </div>
      </div>
      
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-sm font-medium text-gray-500 truncate">Engagement Rate</h2>
        <div class="mt-2 flex items-baseline">
          <div class="text-2xl font-semibold text-gray-900">{engagementRate.toFixed(2)}%</div>
        </div>
      </div>
    </div>
    
    <!-- Performance Chart -->
    {#if performanceData}
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Performance Over Time</h2>
        <div class="h-80">
          <Line data={performanceData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
    {/if}
    
    <!-- Top Performing Posts -->
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Top Performing Posts</h2>
      
      {#if topPosts.length === 0}
        <p class="text-gray-500">No posts available for the selected time period.</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagements
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement Rate
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each topPosts as post}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 truncate max-w-xs">{post.content}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">{format(post.publishedAt, 'MMM dd, yyyy')}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{post.totalEngagements.toLocaleString()}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{post.totalImpressions.toLocaleString()}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{post.engagementRate.toFixed(2)}%</div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>