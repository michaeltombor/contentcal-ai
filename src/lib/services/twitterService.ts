// src/lib/services/twitterService.js
import { TwitterApi } from 'twitter-api-v2';
import { doc, updateDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '$lib/firebase/firebase';

/**
 * Create a Twitter API client with user credentials
 * @param {Object} credentials - Twitter API credentials
 * @returns {TwitterApi} - Twitter API client
 */
function createTwitterClient(credentials) {
    return new TwitterApi({
        appKey: import.meta.env.VITE_TWITTER_API_KEY,
        appSecret: import.meta.env.VITE_TWITTER_API_SECRET,
        accessToken: credentials.accessToken,
        accessSecret: credentials.accessSecret
    });
}

/**
 * Connect a user account to Twitter
 * @param {string} userId - Firebase user ID
 * @param {Object} twitterTokens - Twitter OAuth tokens
 * @returns {Promise<Object>} - Status of the operation
 */
export async function connectTwitterAccount(userId, twitterTokens) {
    try {
        const { accessToken, accessSecret, screenName, userId: twitterUserId } = twitterTokens;

        // Store Twitter account credentials in Firestore
        await addDoc(collection(db, 'socialAccounts'), {
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
        return { success: false, error: error.message };
    }
}

/**
 * Publish a post to Twitter
 * @param {string} userId - Firebase user ID
 * @param {string} postId - Firestore post ID
 * @returns {Promise<Object>} - Status of the operation and Twitter post data
 */
export async function publishToTwitter(userId, postId) {
    try {
        // Get user's Twitter credentials
        const socialAccountsRef = collection(db, 'socialAccounts');
        const querySnapshot = await getDocs(
            query(socialAccountsRef, where('userId', '==', userId), where('platform', '==', 'twitter'))
        );

        if (querySnapshot.empty) {
            return { success: false, error: 'No connected Twitter account found.' };
        }

        const twitterAccount = querySnapshot.docs[0].data();

        // Get the post data
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            return { success: false, error: 'Post not found.' };
        }

        const postData = postSnap.data();

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

        // Check if the post has media
        let tweetOptions = {};
        if (postData.media && postData.media.length > 0) {
            // For simplicity in this MVP, we're assuming media URLs are already processed and available
            // In a real app, you'd handle media uploads to Twitter
            // tweetOptions.media = { media_ids: [...] };
        }

        // Publish the tweet
        const tweet = await twitterClient.v2.tweet(fullTweetText, tweetOptions);

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

        return { success: true, tweetId: tweet.data.id };
    } catch (error) {
        console.error('Error publishing to Twitter:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Fetch tweet analytics
 * @param {string} userId - Firebase user ID
 * @param {string} postId - Firestore post ID
 * @returns {Promise<Object>} - Tweet analytics data
 */
export async function fetchTweetAnalytics(userId, postId) {
    try {
        // Get user's Twitter credentials
        const socialAccountsRef = collection(db, 'socialAccounts');
        const querySnapshot = await getDocs(
            query(socialAccountsRef, where('userId', '==', userId), where('platform', '==', 'twitter'))
        );

        if (querySnapshot.empty) {
            return { success: false, error: 'No connected Twitter account found.' };
        }

        const twitterAccount = querySnapshot.docs[0].data();

        // Get the post data to get the tweet ID
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            return { success: false, error: 'Post not found.' };
        }

        const postData = postSnap.data();

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
        const { retweet_count, reply_count, like_count, quote_count } = tweetData.data.public_metrics;

        // Update analytics in Firestore
        const analyticsData = {
            postId,
            recordedAt: serverTimestamp(),
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

        return { success: true, analytics: analyticsData };
    } catch (error) {
        console.error('Error fetching tweet analytics:', error);
        return { success: false, error: error.message };
    }
}