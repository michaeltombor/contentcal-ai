<!-- src/routes/dashboard/+page.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/authStore';
  import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
  import { db } from '$lib/firebase/firebase';
  import { goto } from '$app/navigation';
  import { format, addDays } from 'date-fns';
  
  let upcomingPosts = [];
  let recentPosts = [];
  let topPerformingPosts = [];
  let loading = true;
  let error = '';
  let socialAccounts = [];
  
  onMount(async () => {
    await Promise.all([
      fetchUpcomingPosts(),
      fetchRecentPosts(),
      fetchTopPerformingPosts(),
      fetchSocialAccounts()
    ]);
    loading = false;
  });
  
  async function fetchUpcomingPosts() {
    try {
      const now = new Date();
      const nextWeek = addDays(now, 7);
      
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', $user.uid),
        where('status', '==', 'scheduled'),
        where('scheduledAt', '>=', now),
        where('scheduledAt', '<=', nextWeek),
        orderBy('scheduledAt')
      );
      
      const snapshot = await getDocs(postsQuery);
      upcomingPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledAt: doc.data().scheduledAt?.toDate()
      }));
    } catch (e) {
      console.error('Error fetching upcoming posts:', e);
    }
  }
  
  async function fetchRecentPosts() {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', $user.uid),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(postsQuery);
      recentPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate()
      }));
    } catch (e) {
      console.error('Error fetching recent posts:', e);
    }
  }
  
  async function fetchTopPerformingPosts() {
    try {
      // This is a simplified version - in a real app, you'd join with analytics
      // For the MVP, we'll just fetch the most recent posts as a placeholder
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', $user.uid),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(3)
      );
      
      const snapshot = await getDocs(postsQuery);
      topPerformingPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate(),
        // Mock engagement data for demonstration
        engagement: Math.floor(Math.random() * 100) + 20
      }));
    } catch (e) {
      console.error('Error fetching top performing posts:', e);
    }
  }
  
  async function fetchSocialAccounts() {
    try {
      const accountsQuery = query(
        collection(db, 'socialAccounts'),
        where('userId', '==', $user.uid)
      );
      
      const snapshot = await getDocs(accountsQuery);
      socialAccounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (e) {
      console.error('Error fetching social accounts:', e);
    }
  }
  
  function navigateToCreatePost() {
    goto('/dashboard/create');
  }
  
  function navigateToCalendar() {
    goto('/dashboard/calendar');
  }
  
  function navigateToAnalytics() {
    goto('/dashboard/analytics');
  }
  
  function navigateToPost(postId) {
    goto(`/dashboard/posts/${postId}`);
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-5">
  <h1 class="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
  
  <!-- Welcome section -->
  <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
    <div class="px-4 py-5 sm:p-6">
      <h2 class="text-lg leading-6 font-medium text-gray-900">
        Welcome back, {$user?.displayName || 'there'}!
      </h2>
      <div class="mt-2 max-w-xl text-sm text-gray-500">
        <p>
          Manage your social media content schedule and get AI-powered recommendations for optimal posting times.
        </p>
      </div>
      <div class="mt-5">
        <button
          type="button"
          on:click={navigateToCreatePost}
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          Create New Post
        </button>
      </div>
    </div>
  </div>
  
  <!-- Connected Accounts -->
  <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
    <div class="px-4 py-5 sm:p-6">
      <h2 class="text-lg leading-6 font-medium text-gray-900 mb-4">
        Connected Social Media Accounts
      </h2>
      
      {#if loading}
        <div class="animate-pulse flex space-x-4">
          <div class="rounded-full bg-gray-200 h-10 w-10"></div>
          <div class="flex-1 space-y-2 py-1">
            <div class="h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      {:else if socialAccounts.length === 0}
        <div class="text-sm text-gray-500 mb-3">
          You haven't connected any social media accounts yet.
        </div>
        <button
          type="button"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Connect Twitter/X
        </button>
      {:else}
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {#each socialAccounts as account}
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <div class="flex-shrink-0">
                {#if account.platform === 'twitter'}
                  <div class="h-10 w-10 rounded-full bg-blue-400 flex items-center justify-center">
                    <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.04 10.04 0 01-3.127 1.196 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </div>
                {/if}
              </div>
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {account.platformData?.screenName || account.platform}
                </div>
                <div class="text-sm text-gray-500">
                  Connected
                </div>
              </div>
            </div>
          {/each}
          
          <div class="p-3 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
            <button class="text-sm text-indigo-600 hover:text-indigo-800">
              + Add another account
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <!-- Upcoming Posts -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg leading-6 font-medium text-gray-900">
            Upcoming Posts
          </h2>
          <button
            type="button"
            on:click={navigateToCalendar}
            class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            View Calendar
          </button>
        </div>
        
        {#if loading}
          <div class="animate-pulse space-y-4">
            {#each Array(3) as _, i}
              <div class="flex space-x-4">
                <div class="flex-1 space-y-2 py-1">
                  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div class="h-12 bg-gray-200 rounded w-20"></div>
              </div>
            {/each}
          </div>
        {:else if upcomingPosts.length === 0}
          <div class="text-sm text-gray-500 py-4">
            No upcoming posts scheduled. Start planning your content!
          </div>
          <button
            type="button"
            on:click={navigateToCreatePost}
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Schedule a Post
          </button>
        {:else}
          <div class="flow-root">
            <ul class="-my-5 divide-y divide-gray-200">
              {#each upcomingPosts as post}
                <li class="py-4">
                  <div class="flex items-center space-x-4">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {post.content.substring(0, 50)}...
                      </p>
                      <p class="text-sm text-gray-500 truncate">
                        {format(post.scheduledAt, 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        on:click={() => navigateToPost(post.id)}
                        class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Top Performing Posts -->
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg leading-6 font-medium text-gray-900">
            Top Performing Posts
          </h2>
          <button
            type="button"
            on:click={navigateToAnalytics}
            class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
          >
            View Analytics
          </button>
        </div>
        
        {#if loading}
          <div class="animate-pulse space-y-4">
            {#each Array(3) as _, i}
              <div class="flex space-x-4">
                <div class="flex-1 space-y-2 py-1">
                  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div class="h-12 bg-gray-200 rounded w-20"></div>
              </div>
            {/each}
          </div>
        {:else if topPerformingPosts.length === 0}
          <div class="text-sm text-gray-500 py-4">
            No published posts yet. Your top performing content will appear here.
          </div>
        {:else}
          <div class="flow-root">
            <ul class="-my-5 divide-y divide-gray-200">
              {#each topPerformingPosts as post}
                <li class="py-4">
                  <div class="flex items-center space-x-4">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {post.content.substring(0, 50)}...
                      </p>
                      <p class="text-sm text-gray-500 truncate">
                        {post.publishedAt ? format(post.publishedAt, 'MMM d, yyyy') : 'Date unavailable'} • 
                        {post.engagement} engagements
                      </p>
                    </div>
                    <div>
                      <button
                        type="button"
                        on:click={() => navigateToPost(post.id)}
                        class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>