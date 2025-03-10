// functions/src/index.ts

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { Anthropic } from '@anthropic-ai/sdk';

// Initialize Firebase
admin.initializeApp();

// Platform types - stricter typing
export enum SocialPlatform {
    TWITTER = 'twitter',
    INSTAGRAM = 'instagram',
    FACEBOOK = 'facebook',
    LINKEDIN = 'linkedin',
}

// Post status types
export enum PostStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    PUBLISHED = 'published',
    FAILED = 'failed',
}

// Initialize Anthropic (Claude)
// Use environment variables for API key with fallback
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey) {
    console.warn('ANTHROPIC_API_KEY environment variable is not set, AI features will not work properly');
}

const anthropic = new Anthropic({
    apiKey: anthropicApiKey || '',
});

// Define consistent Claude model to use
// Using a constant makes it easier to update in the future
const CLAUDE_MODEL = "claude-3-sonnet-20240229";

// Define interface for social media post with stricter typing
interface SocialMediaPost {
    id?: string;
    userId: string;
    content: string;
    mediaUrls?: string[];
    platforms: SocialPlatform[];
    scheduledTime: admin.firestore.Timestamp;
    status: PostStatus;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
    hashtags?: string[];
    aiGenerated?: boolean;
    engagement?: Engagement;
}

// Separate interface for engagement metrics
interface Engagement {
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
}

// Interface for content suggestion request
interface ContentSuggestionRequest {
    prompt?: string;
    platforms?: SocialPlatform[];
    previousPosts?: { content: string }[];
}

// Interface for popular hashtags request
interface HashtagRequest {
    niche?: string;
}

// Interface for post performance analysis request
interface PerformanceAnalysisRequest {
    postId: string;
}

// Interface for content calendar generation request
interface ContentCalendarRequest {
    startDate: string | Date;
    endDate: string | Date;
    frequency?: number;
    platforms?: SocialPlatform[];
    topics?: string[];
}

/**
 * Helper function to safely process Claude API responses
 */
function extractTextFromClaudeResponse(completion: Anthropic.Messages.Message): string {
    const textContent = completion.content.find(content => content.type === 'text');
    if (!textContent || textContent.type !== 'text') {
        throw new Error('Unexpected response format from Claude API');
    }
    return textContent.text;
}

/**
 * Generate content suggestions based on user's previous posts and preferences
 */
export const generateContentSuggestions = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const userId = context.auth.uid;
    const { prompt, platforms, previousPosts } = data as ContentSuggestionRequest;

    try {
        // Validate anthropic API key is available
        if (!anthropicApiKey) {
            throw new Error('ANTHROPIC_API_KEY is not configured');
        }

        // Get user's industry and tone preference from Firestore if available
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();

        const industry = userData?.industry || '';
        const tonePreference = userData?.tonePreference || 'professional';

        // Construct a prompt for Anthropic
        let aiPrompt = `Generate 3 social media post ideas`;

        if (platforms && platforms.length > 0) {
            aiPrompt += ` for ${platforms.join(', ')}`;
        }

        if (industry) {
            aiPrompt += ` in the ${industry} industry`;
        }

        aiPrompt += ` with a ${tonePreference} tone`;

        if (prompt) {
            aiPrompt += ` about ${prompt}`;
        }

        aiPrompt += `. Each post should be engaging and optimized for social media.`;

        // Add examples from previous posts if available
        if (previousPosts && previousPosts.length > 0) {
            aiPrompt += `\n\nHere are examples of previous successful posts for reference:`;

            for (let i = 0; i < Math.min(previousPosts.length, 3); i++) {
                aiPrompt += `\n- ${previousPosts[i].content}`;
            }
        }

        // Call Claude API to generate content
        const completion = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1500,
            system: "You are a social media marketing expert who creates engaging, professional content.",
            messages: [
                { role: "user", content: aiPrompt }
            ],
            temperature: 0.7,
        });

        // Extract and parse the response
        const response = extractTextFromClaudeResponse(completion);

        // Split by numbered points: 1., 2., 3., etc. or by double newlines
        let suggestions = response.split(/\d\.\s+/).filter(Boolean);

        if (suggestions.length <= 1) {
            suggestions = response.split(/\n\n+/).filter(Boolean);
        }

        // Clean up and return the suggestions
        return suggestions.map(suggestion => suggestion.trim()).filter(Boolean);

    } catch (error) {
        console.error('Error generating content suggestions:', error);

        // Classify the error for more specific error handling
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'API configuration error',
                    error.message
                );
            } else if (error.message.includes('Claude API')) {
                throw new functions.https.HttpsError(
                    'internal',
                    'Error processing AI response',
                    error.message
                );
            }
        }

        // Default error
        throw new functions.https.HttpsError(
            'internal',
            'Error generating content suggestions',
            error instanceof Error ? error.message : String(error)
        );
    }
});

/**
 * Get optimal posting times based on user's audience engagement data
 */
export const getBestPostingTimes = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const userId = context.auth.uid;

    try {
        // Get user's published posts with engagement data
        const postsSnapshot = await admin.firestore()
            .collection('posts')
            .where('userId', '==', userId)
            .where('status', '==', PostStatus.PUBLISHED)
            .get();

        const posts = postsSnapshot.docs.map(doc => ({
            ...doc.data() as SocialMediaPost,
            id: doc.id
        }));

        // Get engagement data for analysis
        const analyticsSnapshot = await admin.firestore()
            .collection('analytics')
            .doc(userId)
            .collection('records')
            .get();

        const analytics = analyticsSnapshot.docs.map(doc => doc.data());

        // If we have enough data, analyze for optimal posting times
        if (posts.length > 5 && analytics.length > 0) {
            // Simulate complex engagement analysis
            const engagementByPlatform: Record<string, Record<string, Record<number, number[]>>> = {};

            // Group engagement by platform, day of week, and hour
            posts.forEach(post => {
                if (post.engagement) {
                    const date = post.scheduledTime.toDate();
                    const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
                    const hour = date.getHours(); // 0-23

                    post.platforms.forEach(platform => {
                        if (!engagementByPlatform[platform]) {
                            engagementByPlatform[platform] = {};
                        }

                        if (!engagementByPlatform[platform][dayOfWeek.toString()]) {
                            engagementByPlatform[platform][dayOfWeek.toString()] = {};
                        }

                        if (!engagementByPlatform[platform][dayOfWeek.toString()][hour]) {
                            engagementByPlatform[platform][dayOfWeek.toString()][hour] = [];
                        }

                        // Calculate engagement score (weighted sum of likes, shares, comments, clicks)
                        const engagementScore =
                            (post.engagement?.likes || 0) +
                            (post.engagement?.shares || 0) * 2 +
                            (post.engagement?.comments || 0) * 3 +
                            (post.engagement?.clicks || 0);

                        engagementByPlatform[platform][dayOfWeek.toString()][hour].push(engagementScore);
                    });
                }
            });

            // Find best time for each platform
            const bestTimes = Object.keys(engagementByPlatform).map(platform => {
                let bestDay = 0;
                let bestHour = 9; // Default to 9 AM
                let bestScore = 0;

                Object.keys(engagementByPlatform[platform]).forEach(dayString => {
                    const dayNum = parseInt(dayString);

                    Object.keys(engagementByPlatform[platform][dayString]).forEach(hourString => {
                        const hourNum = parseInt(hourString);
                        const scores = engagementByPlatform[platform][dayString][hourNum];

                        if (scores.length > 0) {
                            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

                            if (avgScore > bestScore) {
                                bestScore = avgScore;
                                bestDay = dayNum;
                                bestHour = hourNum;
                            }
                        }
                    });
                });

                // Convert day number to day name
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const dayName = days[bestDay];

                // Format hour to AM/PM time
                const isPM = bestHour >= 12;
                const hour12 = bestHour % 12 || 12;
                const timeString = `${hour12}:00 ${isPM ? 'PM' : 'AM'}`;

                return {
                    platform,
                    day: dayName,
                    time: timeString,
                    engagementScore: Math.round(bestScore)
                };
            });

            return bestTimes;
        } else {
            // Not enough data, return recommended times based on general best practices
            return [
                { platform: SocialPlatform.TWITTER, day: 'Wednesday', time: '12:00 PM' },
                { platform: SocialPlatform.INSTAGRAM, day: 'Saturday', time: '9:00 AM' },
                { platform: SocialPlatform.FACEBOOK, day: 'Sunday', time: '3:00 PM' },
                { platform: SocialPlatform.LINKEDIN, day: 'Tuesday', time: '8:00 AM' }
            ];
        }
    } catch (error) {
        console.error('Error getting best posting times:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Error determining optimal posting times',
            error instanceof Error ? error.message : String(error)
        );
    }
});

/**
 * Get popular hashtags based on user's niche/industry
 */
export const getPopularHashtags = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const userId = context.auth.uid;
    const { niche } = data as HashtagRequest;

    try {
        // Validate anthropic API key is available
        if (!anthropicApiKey) {
            throw new Error('ANTHROPIC_API_KEY is not configured');
        }

        // Get user's industry from Firestore if niche not provided
        let userIndustry = niche;

        if (!userIndustry) {
            const userDoc = await admin.firestore().collection('users').doc(userId).get();
            const userData = userDoc.data();
            userIndustry = userData?.industry || '';
        }

        // Call Claude to generate trending hashtags for the industry
        const completion = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 200,
            system: "You are a social media marketing expert who knows trending hashtags.",
            messages: [
                {
                    role: "user",
                    content: `Generate 10 popular and trending hashtags for the ${userIndustry || 'digital marketing'} industry. Return only the hashtags without '#' symbol, separated by commas.`
                }
            ],
            temperature: 0.7,
        });

        const response = extractTextFromClaudeResponse(completion);

        // Parse hashtags from response
        let hashtags = response.split(',').map(tag => tag.trim().replace(/^#/, ''));

        // Filter out any empty strings or non-hashtag content
        hashtags = hashtags.filter(tag => tag && !tag.includes(' '));

        // Limit to 10 hashtags
        hashtags = hashtags.slice(0, 10);

        return hashtags;
    } catch (error) {
        console.error('Error getting popular hashtags:', error);

        if (error instanceof Error && error.message.includes('API key')) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'API configuration error',
                error.message
            );
        }

        throw new functions.https.HttpsError(
            'internal',
            'Error fetching popular hashtags',
            error instanceof Error ? error.message : String(error)
        );
    }
});

/**
 * Analyze post performance and provide recommendations
 */
export const analyzePostPerformance = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const userId = context.auth.uid;
    const { postId } = data as PerformanceAnalysisRequest;

    // Validate required parameters
    if (!postId) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Post ID is required'
        );
    }

    try {
        // Validate anthropic API key is available
        if (!anthropicApiKey) {
            throw new Error('ANTHROPIC_API_KEY is not configured');
        }

        // Get the post data
        const postDoc = await admin.firestore()
            .collection('posts')
            .doc(postId)
            .get();

        if (!postDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Post not found'
            );
        }

        const post = postDoc.data() as SocialMediaPost;

        // Verify the post belongs to the authenticated user
        if (post.userId !== userId) {
            throw new functions.https.HttpsError(
                'permission-denied',
                'You do not have permission to analyze this post'
            );
        }

        // Get engagement data for the post
        const engagement = post.engagement || { likes: 0, shares: 0, comments: 0, clicks: 0 };

        // Calculate engagement score (0-100)
        let engagementScore = 0;

        if (post.platforms.includes(SocialPlatform.TWITTER)) {
            engagementScore = Math.min(
                100,
                ((engagement.likes * 1) + (engagement.shares * 2) + (engagement.comments * 3) + (engagement.clicks * 0.5)) / 2
            );
        } else if (post.platforms.includes(SocialPlatform.INSTAGRAM)) {
            engagementScore = Math.min(
                100,
                ((engagement.likes * 1) + (engagement.comments * 3) + (engagement.shares * 5)) / 3
            );
        } else if (post.platforms.includes(SocialPlatform.LINKEDIN)) {
            engagementScore = Math.min(
                100,
                ((engagement.likes * 1) + (engagement.comments * 3) + (engagement.shares * 4) + (engagement.clicks * 2)) / 2.5
            );
        } else {
            engagementScore = Math.min(
                100,
                ((engagement.likes * 1) + (engagement.shares * 2) + (engagement.comments * 2) + (engagement.clicks * 1)) / 2
            );
        }

        // Round to nearest integer
        engagementScore = Math.round(engagementScore);

        // Generate content improvement suggestions using Claude
        const completion = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 300,
            system: "You are a social media marketing expert who analyzes post performance and provides concise, actionable suggestions.",
            messages: [
                {
                    role: "user",
                    content: `Analyze this social media post and provide 3 brief suggestions for improving engagement. The post was published on ${post.platforms.join(', ')} and received ${engagement.likes} likes, ${engagement.shares} shares, ${engagement.comments} comments, and ${engagement.clicks} clicks.\n\nPost content: "${post.content}"\n\nProvide only 3 short, actionable suggestions, each on a new line.`
                }
            ],
            temperature: 0.7,
        });

        const response = extractTextFromClaudeResponse(completion);

        // Parse suggestions from response (assuming one per line)
        const improvements = response.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.match(/^(\d+\.|\-|\*)/)) // Remove numbered/bullet points
            .slice(0, 3); // Limit to 3 suggestions

        // Determine best time to repost based on platform and engagement patterns
        // For now, using a simplified approach - but in the future, this would use more complex analysis
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const day = days[Math.floor(Math.random() * 7)];

        // Business hours (8 AM - 7 PM)
        const hour = 8 + Math.floor(Math.random() * 12);
        const minute = Math.round(Math.random() * 59 / 5) * 5; // Round to nearest 5 minutes
        const isPM = hour >= 12;
        const hourFormatted = isPM ? (hour === 12 ? 12 : hour - 12) : hour;
        const timeString = `${hourFormatted}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;

        // Return analysis results
        return {
            score: engagementScore,
            improvements,
            bestTimeToRepost: { day, time: timeString }
        };
    } catch (error) {
        console.error('Error analyzing post performance:', error);

        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw if it's already an HttpsError
        }

        if (error instanceof Error && error.message.includes('API key')) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'API configuration error',
                error.message
            );
        }

        throw new functions.https.HttpsError(
            'internal',
            'Error analyzing post performance',
            error instanceof Error ? error.message : String(error)
        );
    }
});

/**
 * Generate a content calendar for a specific date range
 */
export const generateContentCalendar = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'The function must be called while authenticated.'
        );
    }

    const userId = context.auth.uid;
    const { startDate, endDate, frequency, platforms, topics } = data as ContentCalendarRequest;

    // Validate input
    if (!startDate || !endDate) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Start date and end date are required'
        );
    }

    try {
        // Validate anthropic API key is available
        if (!anthropicApiKey) {
            throw new Error('ANTHROPIC_API_KEY is not configured');
        }

        // Convert string dates to Date objects
        const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
        const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

        // Validate date range
        if (start >= end) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'End date must be after start date'
            );
        }

        // Get user's industry and tone preferences
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data() || {};
        const userIndustry = userData.industry || 'digital marketing';
        const userTone = userData.tonePreference || 'professional';

        // Generate post dates based on frequency
        const postsPerWeek = frequency || 3;
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.ceil(totalDays / 7);
        const totalPosts = Math.max(1, Math.ceil(totalWeeks * postsPerWeek));

        // Limit to a reasonable number to prevent abuse
        if (totalPosts > 30) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Maximum of 30 posts can be generated at once'
            );
        }

        // Determine posting dates
        const postDates: Date[] = [];
        for (let i = 0; i < totalPosts; i++) {
            // Distribute posts evenly across the date range
            const progress = i / (totalPosts - 1 || 1);
            const timestamp = start.getTime() + progress * (end.getTime() - start.getTime());

            // Add some randomness to the posting times
            const hour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
            const minute = Math.round(Math.random() * 59 / 5) * 5; // Round to nearest 5 minutes

            const postDate = new Date(timestamp);
            postDate.setHours(hour, minute, 0, 0);

            postDates.push(postDate);
        }

        // Sort dates in ascending order
        postDates.sort((a, b) => a.getTime() - b.getTime());

        // Prepare topics string for the AI prompt
        const topicsString = topics && topics.length > 0
            ? `The content should focus on these topics: ${topics.join(', ')}.`
            : `The content should be relevant to the ${userIndustry} industry.`;

        // Generate content suggestions using Claude
        const completion = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1500,
            system: `You are a social media content calendar generator who creates engaging posts for ${platforms ? platforms.join(', ') : 'social media'}. You create content with a ${userTone} tone.`,
            messages: [
                {
                    role: "user",
                    content: `Generate ${totalPosts} unique social media posts for a content calendar. ${topicsString} Each post should include the main content and suggested hashtags (maximum 5 hashtags). Format each post as: "CONTENT: [the post content] HASHTAGS: [hashtag1, hashtag2, etc.]"`
                }
            ],
            temperature: 0.8,
        });

        const response = extractTextFromClaudeResponse(completion);

        // Parse posts from response
        const postContents = response.split(/(?:^|\n)(?:\d+\.\s*|\-\s*)/g)
            .map(post => post.trim())
            .filter(Boolean);

        // Create post objects
        const posts: Partial<SocialMediaPost>[] = [];

        for (let i = 0; i < Math.min(postDates.length, postContents.length); i++) {
            const postContent = postContents[i];

            // Extract content and hashtags
            const contentMatch = postContent.match(/CONTENT:\s*(.*?)(?:\s+HASHTAGS:|$)/is);
            const hashtagsMatch = postContent.match(/HASHTAGS:\s*(.*?)$/is);

            const content = contentMatch ? contentMatch[1].trim() : postContent;
            const hashtagsText = hashtagsMatch ? hashtagsMatch[1].trim() : '';

            // Parse hashtags
            const hashtags = hashtagsText
                .split(/,\s*/)
                .map(tag => tag.trim().replace(/^#/, ''))
                .filter(Boolean);

            // Validate platforms or use default
            const validPlatforms = (platforms || [SocialPlatform.TWITTER])
                .filter(p => Object.values(SocialPlatform).includes(p as SocialPlatform))
                .map(p => p as SocialPlatform);

            const post: Partial<SocialMediaPost> = {
                userId,
                content,
                hashtags,
                platforms: validPlatforms.length > 0 ? validPlatforms : [SocialPlatform.TWITTER],
                scheduledTime: admin.firestore.Timestamp.fromDate(postDates[i]),
                status: PostStatus.DRAFT,
                aiGenerated: true,
                createdAt: admin.firestore.Timestamp.now(),
                updatedAt: admin.firestore.Timestamp.now()
            };

            posts.push(post);
        }

        // Return the generated posts
        return posts;
    } catch (error) {
        console.error('Error generating content calendar:', error);

        if (error instanceof functions.https.HttpsError) {
            throw error; // Re-throw if it's already an HttpsError
        }

        if (error instanceof Error && error.message.includes('API key')) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'API configuration error',
                error.message
            );
        }

        throw new functions.https.HttpsError(
            'internal',
            'Error generating content calendar',
            error instanceof Error ? error.message : String(error)
        );
    }
});

/**
 * Scheduled function to sync posts with external social media platforms
 * Using Firebase Functions v1 syntax for scheduled functions
 */
export const scheduledPostSync = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
        try {
            const now = admin.firestore.Timestamp.now();
            const fiveMinutesFromNow = admin.firestore.Timestamp.fromDate(
                new Date(now.toDate().getTime() + 5 * 60 * 1000)
            );

            // Find posts scheduled to be published in the next 5 minutes
            const postsToPublish = await admin.firestore()
                .collection('posts')
                .where('status', '==', PostStatus.SCHEDULED)
                .where('scheduledTime', '>=', now)
                .where('scheduledTime', '<=', fiveMinutesFromNow)
                .get();

            console.log(`Found ${postsToPublish.size} posts to publish in the next 5 minutes`);

            if (postsToPublish.empty) {
                console.log('No posts to publish at this time');
                return null;
            }

            // Process each post
            const results = await Promise.all(postsToPublish.docs.map(async (doc) => {
                const post = doc.data() as SocialMediaPost;

                try {
                    // In a real app, you would connect to each platform's API
                    // and publish the content
                    console.log(`Publishing post ${doc.id} to platforms: ${post.platforms.join(', ')}`);

                    // Here you would add logic to publish to each platform
                    // For now, we're just updating the status
                    await doc.ref.update({
                        status: PostStatus.PUBLISHED,
                        updatedAt: admin.firestore.Timestamp.now()
                    });

                    return { success: true, postId: doc.id };
                } catch (error) {
                    console.error(`Error publishing post ${doc.id}:`, error);

                    // Update status to failed
                    await doc.ref.update({
                        status: PostStatus.FAILED,
                        updatedAt: admin.firestore.Timestamp.now()
                    });

                    return {
                        success: false,
                        postId: doc.id,
                        error: error instanceof Error ? error.message : String(error)
                    };
                }
            }));

            console.log(`Processed ${results.length} posts`);
            return results;
        } catch (error) {
            console.error('Error in scheduledPostSync:', error);
            return null;
        }
    });