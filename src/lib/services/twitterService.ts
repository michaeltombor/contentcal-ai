// src/lib/services/twitterService.ts
import { TwitterApi, type TweetV2, type TweetV2PostTweetResult } from 'twitter-api-v2';
import {
    doc,
    updateDoc,
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    getDoc,
    query,
    where,
    type DocumentData,
    Timestamp
} from 'firebase/firestore';
import { getFirebaseFirestore } from '$lib/firebase/firebase';

// Types for Twitter credentials and responses
interface TwitterCredentials {
    accessToken: string;
    accessSecret: string;
}

interface TwitterTokens extends TwitterCredentials {
    screenName: string;
    userId: string;
}

interface TwitterAnalytics {
    tweetId: string;
    retweetCount: number;
    replyCount: number;
    likeCount: number;
    quoteCount: number;
}

interface PostAnalytics {
    postId: string;
    recordedAt: Timestamp;
    impressions: number;
    engagements: number;
    likes: number;
    shares: number;
    comments: number;
    clicks: number;
    platformSpecificData: {
        twitter?: TwitterAnalytics;
    };
}

interface ServiceResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T;
}

interface TwitterPostOptions {
    media?: {
        media_ids: [string] | [string, string] | [string, string, string] | [string, string, string, string];
    };
}

interface PostData {
    content: string;
    hashtags?: string[];
    media?: Array<{
        url: string;
        type: string;
    }>;
    status?: string;
    publishedAt?: Timestamp;
    platformData?: {
        twitter?: {
            tweetId?: string;
        };
    };
}

/**
 * Create a Twitter API client with user credentials
 * @param credentials - Twitter API credentials
 * @returns Twitter API client
 */
function createTwitterClient(credentials: TwitterCredentials): TwitterApi {
    if (!import.meta.env.VITE_TWITTER_API_KEY || !import.meta.env.VITE_TWITTER_API_SECRET) {
        throw new Error('Twitter API keys are not configured in environment variables');
    }

    return new TwitterApi({
        appKey: import.meta.env.VITE_TWITTER_API_KEY,
        appSecret: import.meta.env.VITE_TWITTER_API_SECRET,
        accessToken: credentials.accessToken,
        accessSecret: credentials.accessSecret
    });
}

/**
 * Connect a user account to Twitter
 * @param userId - Firebase user ID
 * @param twitterTokens - Twitter OAuth tokens
 * @returns Status of the operation
 */
export async function connectTwitterAccount(
    userId: string,
    twitterTokens: TwitterTokens
): Promise<ServiceResponse> {
    try {
        const { accessToken, accessSecret, screenName, userId: twitterUserId } = twitterTokens;
        const db = getFirebaseFirestore();

        // Store Twitter account credentials in Firestore
        await addDoc(collection(db, 'users', userId, 'socialAccounts'), {
            userId,
            platform: 'twitter',
            accessToken,
            accessSecret,
            platformData: {
                screenName,
                userId: twitterUserId
            },
            createdAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error connecting Twitter account:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Publish a post to Twitter
 * @param userId - Firebase user ID
 * @param postId - Firestore post ID
 * @returns Status of the operation and Twitter post data
 */
export async function publishToTwitter(
    userId: string,
    postId: string
): Promise<ServiceResponse<{ tweetId: string }>> {
    try {
        const db = getFirebaseFirestore();

        // Get user's Twitter credentials
        const socialAccountsRef = collection(db, 'users', userId, 'socialAccounts');
        const querySnapshot = await getDocs(
            query(socialAccountsRef, where('platform', '==', 'twitter'))
        );

        if (querySnapshot.empty) {
            return { success: false, error: 'No connected Twitter account found.' };
        }

        const twitterAccount = querySnapshot.docs[0].data();

        // Get the post data
        const postRef = doc(db, 'content', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            return { success: false, error: 'Post not found.' };
        }

        const postData = postSnap.data() as PostData;

        // Create Twitter API client
        const twitterClient = createTwitterClient({
            accessToken: twitterAccount.accessToken,
            accessSecret: twitterAccount.accessSecret
        });

        // Prepare tweet content
        const tweetText = postData.content;

        // Add hashtags if any
        const hashtags = postData.hashtags || [];
        const hashtagsText = hashtags.length > 0 ? ' ' + hashtags.join(' ') : '';

        const fullTweetText = tweetText + hashtagsText;

        // Prepare tweet options with media
        const tweetOptions: TwitterPostOptions = {};
        if (postData.media && postData.media.length > 0) {
            const mediaIds = postData.media.map(media => media.url); // Assuming media.url is the media ID
            if (mediaIds.length > 0 && mediaIds.length <= 4) {
                tweetOptions.media = { media_ids: mediaIds as [string] | [string, string] | [string, string, string] | [string, string, string, string] };
            }
        }

        // Publish the tweet
        const tweet = await twitterClient.v2.tweet(fullTweetText, tweetOptions) as TweetV2PostTweetResult;

        // Update the post status in Firestore
        await updateDoc(postRef, {
            status: 'published',
            publishedAt: serverTimestamp(),
            platformData: {
                twitter: {
                    tweetId: tweet.data.id
                }
            }
        });

        // Create an initial analytics entry
        await addDoc(collection(db, 'postAnalytics'), {
            postId,
            recordedAt: serverTimestamp(),
            impressions: 0,
            engagements: 0,
            likes: 0,
            shares: 0,
            comments: 0,
            clicks: 0,
            platformSpecificData: {
                twitter: {
                    tweetId: tweet.data.id
                }
            }
        });

        return { success: true, data: { tweetId: tweet.data.id } };
    } catch (error) {
        console.error('Error publishing to Twitter:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Fetch tweet analytics
 * @param userId - Firebase user ID
 * @param postId - Firestore post ID
 * @returns Tweet analytics data
 */
export async function fetchTweetAnalytics(
    userId: string,
    postId: string
): Promise<ServiceResponse<PostAnalytics>> {
    try {
        const db = getFirebaseFirestore();

        // Get user's Twitter credentials
        const socialAccountsRef = collection(db, 'users', userId, 'socialAccounts');
        const querySnapshot = await getDocs(
            query(socialAccountsRef, where('platform', '==', 'twitter'))
        );

        if (querySnapshot.empty) {
            return { success: false, error: 'No connected Twitter account found.' };
        }

        const twitterAccount = querySnapshot.docs[0].data();

        // Get the post data to get the tweet ID
        const postRef = doc(db, 'content', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            return { success: false, error: 'Post not found.' };
        }

        const postData = postSnap.data() as PostData;

        // Check if the post has Twitter platform data
        if (!postData.platformData?.twitter?.tweetId) {
            return { success: false, error: 'Tweet ID not found.' };
        }

        const tweetId = postData.platformData.twitter.tweetId;

        // Create Twitter API client
        const twitterClient = createTwitterClient({
            accessToken: twitterAccount.accessToken,
            accessSecret: twitterAccount.accessSecret
        });

        // Fetch tweet data including public metrics
        const tweetData = await twitterClient.v2.singleTweet(tweetId, {
            'tweet.fields': ['public_metrics', 'created_at']
        });

        // Extract metrics
        const metrics = tweetData.data.public_metrics!;
        const { retweet_count, reply_count, like_count, quote_count } = metrics;

        // Update analytics in Firestore
        const analyticsData: PostAnalytics = {
            postId,
            recordedAt: serverTimestamp() as Timestamp,
            impressions: 0, // Twitter API doesn't provide impression count in v2 for free
            engagements: retweet_count + reply_count + like_count + quote_count,
            likes: like_count,
            shares: retweet_count + quote_count,
            comments: reply_count,
            clicks: 0, // Twitter API doesn't provide click count in v2 for free
            platformSpecificData: {
                twitter: {
                    tweetId,
                    retweetCount: retweet_count,
                    replyCount: reply_count,
                    likeCount: like_count,
                    quoteCount: quote_count
                }
            }
        };

        // Add to analytics collection
        await addDoc(collection(db, 'postAnalytics'), analyticsData);

        return { success: true, data: analyticsData };
    } catch (error) {
        console.error('Error fetching tweet analytics:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Get all Twitter accounts connected to a user
 * @param userId - Firebase user ID
 * @returns List of connected Twitter accounts
 */
export async function getConnectedTwitterAccounts(
    userId: string
): Promise<ServiceResponse<Array<DocumentData>>> {
    try {
        const db = getFirebaseFirestore();

        const socialAccountsRef = collection(db, 'users', userId, 'socialAccounts');
        const querySnapshot = await getDocs(
            query(socialAccountsRef, where('platform', '==', 'twitter'))
        );

        const accounts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Remove sensitive information from the client response
            accessToken: undefined,
            accessSecret: undefined
        }));

        return { success: true, data: accounts };
    } catch (error) {
        console.error('Error fetching Twitter accounts:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Disconnect a Twitter account
 * @param userId - Firebase user ID
 * @param accountId - Firestore account document ID
 * @returns Status of the operation
 */
export async function disconnectTwitterAccount(
    userId: string,
    accountId: string
): Promise<ServiceResponse> {
    try {
        const db = getFirebaseFirestore();

        const accountRef = doc(db, 'users', userId, 'socialAccounts', accountId);
        const accountSnap = await getDoc(accountRef);

        if (!accountSnap.exists()) {
            return { success: false, error: 'Account not found.' };
        }

        // Verify the account belongs to Twitter platform
        const accountData = accountSnap.data();
        if (accountData.platform !== 'twitter') {
            return { success: false, error: 'Invalid account type.' };
        }
        // Delete the account document
        await import('firebase/firestore').then(module => module.deleteDoc(accountRef));

        return { success: true };
    } catch (error) {
        console.error('Error disconnecting Twitter account:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}