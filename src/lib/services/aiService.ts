// src/lib/services/aiService.ts

import { getAuth } from 'firebase/auth';
import {
    getFirestore,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import type { SocialMediaPost, PlatformType } from '$lib/types/calendar';
import { writable, type Writable } from 'svelte/store';

// Store for AI recommendations
export const aiRecommendations: Writable<{
    content: string[];
    bestTimes: { platform: PlatformType; day: string; time: string }[];
    hashtags: string[];
    isLoading: boolean;
}> = writable({
    content: [],
    bestTimes: [],
    hashtags: [],
    isLoading: false
});

// Get the best posting times based on user engagement data
export async function getBestPostingTimes(): Promise<{ platform: PlatformType; day: string; time: string }[]> {
    try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Set loading state
        aiRecommendations.update(state => ({ ...state, isLoading: true }));

        // Call the Firebase Cloud Function
        const functions = getFunctions();
        const getBestTimesFunction = httpsCallable(functions, 'getBestPostingTimes');
        const result = await getBestTimesFunction({ userId });

        // The result data is in result.data
        const bestTimes = result.data as { platform: PlatformType; day: string; time: string }[];

        // Update the store
        aiRecommendations.update(state => ({
            ...state,
            bestTimes,
            isLoading: false
        }));

        return bestTimes;
    } catch (error) {
        console.error('Error getting best posting times:', error);

        // Update the store with error state
        aiRecommendations.update(state => ({ ...state, isLoading: false }));

        // Return fallback data
        return [
            { platform: 'twitter', day: 'Wednesday', time: '12:00 PM' },
            { platform: 'instagram', day: 'Saturday', time: '9:00 AM' },
            { platform: 'facebook', day: 'Sunday', time: '3:00 PM' },
            { platform: 'linkedin', day: 'Tuesday', time: '8:00 AM' }
        ];
    }
}

// Get popular hashtags based on user's niche
export async function getPopularHashtags(niche: string = ''): Promise<string[]> {
    try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Set loading state
        aiRecommendations.update(state => ({ ...state, isLoading: true }));

        // Call the Firebase Cloud Function
        const functions = getFunctions();
        const getHashtagsFunction = httpsCallable(functions, 'getPopularHashtags');
        const result = await getHashtagsFunction({ userId, niche });

        // The result data is in result.data
        const hashtags = result.data as string[];

        // Update the store
        aiRecommendations.update(state => ({
            ...state,
            hashtags,
            isLoading: false
        }));

        return hashtags;
    } catch (error) {
        console.error('Error getting popular hashtags:', error);

        // Update the store with error state
        aiRecommendations.update(state => ({ ...state, isLoading: false }));

        // Return fallback data
        return [
            'contentmarketing', 'socialmediatips', 'digitalmarketing',
            'growthhacking', 'marketing', 'business', 'entrepreneur',
            'contentcreation', 'contentcalendar', 'scheduling'
        ];
    }
}

// Generate AI content suggestions based on user's previous posts and industry
export async function generateContentSuggestions(
    prompt: string = '',
    platforms: PlatformType[] = ['twitter']
): Promise<string[]> {
    try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Set loading state
        aiRecommendations.update(state => ({ ...state, isLoading: true }));

        // Get the user's previous posts to analyze their style
        const db = getFirestore();
        const postsQuery = query(
            collection(db, 'posts'),
            where('userId', '==', userId),
            where('status', '==', 'published'),
            orderBy('updatedAt', 'desc'),
            limit(20)
        );

        const postsSnapshot = await getDocs(postsQuery);
        const previousPosts = postsSnapshot.docs.map(doc => doc.data() as SocialMediaPost);

        // Call the Firebase Cloud Function
        const functions = getFunctions();
        const generateContentFunction = httpsCallable(functions, 'generateContentSuggestions');
        const result = await generateContentFunction({
            userId,
            prompt,
            platforms,
            previousPosts: previousPosts.length > 0 ? previousPosts : undefined
        });

        // The result data is in result.data
        const suggestions = result.data as string[];

        // Update the store
        aiRecommendations.update(state => ({
            ...state,
            content: suggestions,
            isLoading: false
        }));

        return suggestions;
    } catch (error) {
        console.error('Error generating content suggestions:', error);

        // Update the store with error state
        aiRecommendations.update(state => ({ ...state, isLoading: false }));

        // Return fallback data based on platforms
        if (platforms.includes('twitter')) {
            return [
                "Just published our latest blog post on content marketing strategies for 2025! Check it out and let me know your thoughts. #ContentMarketing #DigitalStrategy",
                "Looking for ways to improve your social media presence? Here are 3 simple techniques that helped our clients increase engagement by 45% this quarter.",
                "Happy Friday! What are your content marketing goals for the coming week? Share below and let's inspire each other. #FridayThoughts #ContentGoals"
            ];
        } else if (platforms.includes('linkedin')) {
            return [
                "Excited to announce our latest case study: How we helped a SaaS startup increase their conversion rate by 32% through strategic content calendar management. #SaaS #ContentStrategy",
                "The future of content marketing isn't just about creating more content—it's about creating the RIGHT content for the RIGHT audience at the RIGHT time.",
                "Three trends reshaping social media marketing in 2025:\n\n1. AI-powered content personalization\n2. Micro-community engagement\n3. Cross-platform storytelling\n\nWhich one are you implementing in your strategy?"
            ];
        } else {
            return [
                "New feature alert! 🚀 We've just launched our AI content recommendation engine to help you create more engaging posts with less effort. #ProductUpdate #ContentCalAI",
                "Beautiful sunrise this morning has us feeling inspired! What's motivating you to create great content today? #MondayMotivation #ContentCreation",
                "Behind the scenes at our product demo today! So excited to show how ContentCal.AI can revolutionize your social media workflow. #BehindTheScenes #SocialMediaTools"
            ];
        }
    }
}

// Analyze post performance to provide content improvement suggestions
export async function analyzePostPerformance(postId: string): Promise<{
    score: number;
    improvements: string[];
    bestTimeToRepost: { day: string; time: string };
}> {
    try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Call the Firebase Cloud Function
        const functions = getFunctions();
        const analyzePostFunction = httpsCallable(functions, 'analyzePostPerformance');
        const result = await analyzePostFunction({ userId, postId });

        // Return the analysis
        return result.data as {
            score: number;
            improvements: string[];
            bestTimeToRepost: { day: string; time: string };
        };
    } catch (error) {
        console.error('Error analyzing post performance:', error);

        // Return fallback data
        return {
            score: 72,
            improvements: [
                'Try adding more engaging questions to increase comments',
                'Consider including 1-2 relevant hashtags for better reach',
                'Posts with images typically get 38% more engagement'
            ],
            bestTimeToRepost: { day: 'Thursday', time: '5:30 PM' }
        };
    }
}

// Generate an entire content calendar for a specified period
export async function generateContentCalendar(
    startDate: Date,
    endDate: Date,
    frequency: number = 3, // posts per week
    platforms: PlatformType[] = ['twitter', 'linkedin'],
    topics: string[] = []
): Promise<SocialMediaPost[]> {
    try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Call the Firebase Cloud Function
        const functions = getFunctions();
        const generateCalendarFunction = httpsCallable(functions, 'generateContentCalendar');
        const result = await generateCalendarFunction({
            userId,
            startDate,
            endDate,
            frequency,
            platforms,
            topics
        });

        // Return the generated posts
        return result.data as SocialMediaPost[];
    } catch (error) {
        console.error('Error generating content calendar:', error);
        throw error;
    }
}