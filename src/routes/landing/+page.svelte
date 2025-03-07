<!-- src/routes/landing/+page.svelte -->
<script>
  import { goto } from '$app/navigation';
  
  function navigateToAuth() {
    goto('/auth');
  }
</script>

<div class="bg-white">
  <header class="relative">
    <div class="bg-indigo-600">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div class="w-full py-6 flex items-center justify-between border-b border-indigo-500 lg:border-none">
          <div class="flex items-center">
            <a href="/">
              <span class="text-xl font-bold text-white">ContentCal.AI</span>
            </a>
          </div>
          <div class="ml-10 space-x-4">
            <button
              on:click={navigateToAuth}
              class="inline-block bg-indigo-500 py-2 px-4 border border-transparent rounded-md text-base font-medium text-white hover:bg-opacity-75"
            >
              Sign in
            </button>
            <button
              on:click={() => goto('/auth?mode=register')}
              class="inline-block bg-white py-2 px-4 border border-transparent rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>
    </div>
  </header>

  <main>
    <!-- Hero section -->
    <div class="relative">
      <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100"></div>
      <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div class="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
          <div class="absolute inset-0">
            <div class="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-600"></div>
          </div>
          <div class="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
            <h1 class="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span class="block text-white">Streamline your</span>
              <span class="block text-indigo-200">social media workflow</span>
            </h1>
            <p class="mt-6 max-w-lg mx-auto text-center text-xl text-indigo-200 sm:max-w-3xl">
              ContentCal.AI helps you schedule, optimize, and analyze your social media content using AI-powered recommendations.
            </p>
            <div class="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
              <div class="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                <a
                  href="/auth?mode=register"
                  class="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 sm:px-8"
                >
                  Get started
                </a>
                <a
                  href="#features"
                  class="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70 sm:px-8"
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Features section -->
    <div id="features" class="py-16 bg-gray-100 overflow-hidden lg:py-24">
      <div class="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
        <div class="relative">
          <h2 class="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Intelligent Social Media Management
          </h2>
          <p class="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
            ContentCal.AI combines powerful scheduling features with AI-driven insights to optimize your social media content.
          </p>
        </div>

        <div class="relative mt-12 lg:mt-20 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          <div class="relative">
            <h3 class="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
              Smart Scheduling
            </h3>
            <p class="mt-3 text-lg text-gray-500">
              Schedule your posts across multiple platforms and get AI recommendations for the best posting times based on your audience's activity patterns.
            </p>

            <dl class="mt-10 space-y-10">
              <div class="relative">
                <dt>
                  <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Visual Calendar Interface</p>
                </dt>
                <dd class="mt-2 ml-16 text-base text-gray-500">
                  Drag and drop content directly onto your calendar to schedule posts with ease.
                </dd>
              </div>

              <div class="relative">
                <dt>
                  <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p class="ml-16 text-lg leading-6 font-medium text-gray-900">AI-Optimized Posting Times</p>
                </dt>
                <dd class="mt-2 ml-16 text-base text-gray-500">
                  Let our AI analyze your past performance to recommend the best times to post for maximum engagement.
                </dd>
              </div>
            </dl>
          </div>

          <div class="mt-10 -mx-4 relative lg:mt-0" aria-hidden="true">
            <div class="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
              <div class="relative block w-full bg-white sm:rounded-lg overflow-hidden">
                <div class="w-full aspect-w-16 aspect-h-9 bg-gray-200">
                  <!-- Calendar preview image would go here -->
                  <div class="flex items-center justify-center h-full bg-indigo-100 text-indigo-500">
                    <svg class="h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="relative mt-12 sm:mt-16 lg:mt-24">
          <div class="lg:grid lg:grid-flow-row-dense lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div class="lg:col-start-2">
              <h3 class="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                Performance Analytics
              </h3>
              <p class="mt-3 text-lg text-gray-500">
                Track your social media performance with comprehensive analytics dashboards that help you understand what content works best.
              </p>

              <dl class="mt-10 space-y-10">
                <div class="relative">
                  <dt>
                    <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Real-time Metrics</p>
                  </dt>
                  <dd class="mt-2 ml-16 text-base text-gray-500">
                    Monitor engagement, reach, clicks, and conversions in real-time across all your social platforms.
                  </dd>
                </div>

                <div class="relative">
                  <dt>
                    <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                      <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Content Optimization</p>
                  </dt>
                  <dd class="mt-2 ml-16 text-base text-gray-500">
                    Get AI-powered recommendations to improve your content strategy based on what resonates with your audience.
                  </dd>
                </div>
              </dl>
            </div>

            <div class="mt-10 -mx-4 relative lg:mt-0 lg:col-start-1">
              <div class="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div class="relative block w-full bg-white sm:rounded-lg overflow-hidden">
                  <div class="w-full aspect-w-16 aspect-h-9 bg-gray-200">
                    <!-- Analytics preview image would go here -->
                    <div class="flex items-center justify-center h-full bg-indigo-100 text-indigo-500">
                      <svg class="h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA section -->
    <div class="bg-indigo-700">
      <div class="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-extrabold text-white sm:text-4xl">
          <span class="block">Boost your social media presence</span>
          <span class="block">Start using ContentCal.AI today</span>
        </h2>
        <p class="mt-4 text-lg leading-6 text-indigo-200">
          Join thousands of social media managers and content creators who are optimizing their content strategy with ContentCal.AI.
        </p>
        <a
          href="/auth?mode=register"
          class="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
        >
          Sign up for free
        </a>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="bg-gray-800" aria-labelledby="footer-heading">
    <h2 id="footer-heading" class="sr-only">Footer</h2>
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <div class="border-t border-gray-700 pt-8 mt-8 md:flex md:items-center md:justify-between">
        <div class="flex space-x-6 md:order-2">
          <!-- Social links -->
        </div>
        <p class="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
          &copy; 2025 ContentCal.AI. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</div>