// src/lib/utils/cors-fix.ts

/**
 * TEMPORARY CORS WORKAROUND FOR DEVELOPMENT ONLY
 * This intercepts fetch requests and adds CORS headers for development
 * DO NOT USE IN PRODUCTION
 */
export function setupCorsProxy() {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
        const originalFetch = window.fetch;

        window.fetch = async function (input, init) {
            // Only intercept Firebase Storage URLs
            if (typeof input === 'string' &&
                input.includes('firebasestorage.googleapis.com')) {

                // Create URL object to get the pathname
                const url = new URL(input);

                // Add a timestamp to bust cache
                url.searchParams.append('t', Date.now().toString());

                // Create new init object with CORS mode
                const newInit: RequestInit = {
                    ...init,
                    mode: 'cors',
                    credentials: 'omit' as RequestCredentials,
                    headers: {
                        ...(init?.headers || {}),
                        'Access-Control-Allow-Origin': '*',
                    }
                };

                try {
                    // Try the modified request
                    return await originalFetch(url.toString(), newInit);
                } catch (error) {
                    console.warn('CORS fetch failed, trying original request', error);
                    return await originalFetch(input, init);
                }
            }

            // Pass through for non-Firebase Storage URLs
            return originalFetch(input, init);
        };

        console.log('Development CORS proxy enabled');
    }
}