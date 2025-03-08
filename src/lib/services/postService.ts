// src/lib/services/postService.ts

import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, query, where, getDocs, getDoc, orderBy, Timestamp, onSnapshot, type DocumentData } from 'firebase/firestore';
import type { SocialMediaPost, CalendarEvent, PlatformType, PostStatus } from '$lib/types/calendar';
import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getAuth } from 'firebase/auth';

// Initialize Firestore from the Firebase app
const db = getFirestore();

// Stores for reactive state
export const postsStore: Writable<SocialMediaPost[]> = writable([]);
export const calendarEventsStore: Writable<CalendarEvent[]> = writable([]);
export const loadingPosts: Writable<boolean> = writable(false);

// Convert Firestore Timestamp to Date
const convertTimestampToDate = (data: DocumentData): DocumentData => {
    const result = { ...data };

    for (const [key, value] of Object.entries(result)) {
        if (value instanceof Timestamp) {
            result[key] = value.toDate();
        } else if (value && typeof value === 'object') {
            result[key] = convertTimestampToDate(value);
        }
    }

    return result;
};

// Convert Date to Firestore Timestamp
const convertDateToTimestamp = (data: Record<string, any>): Record<string, any> => {
    const result = { ...data };

    for (const [key, value] of Object.entries(result)) {
        if (value instanceof Date) {
            result[key] = Timestamp.fromDate(value);
        } else if (value && typeof value === 'object' && !(value instanceof Timestamp)) {
            result[key] = convertDateToTimestamp(value);
        }
    }

    return result;
};

// Subscribe to posts for the current user
export const subscribeToPosts = (): (() => void) => {
    if (!browser) return () => { };

    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
        console.error('User not authenticated');
        return () => { };
    }

    loadingPosts.set(true);

    const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('scheduledTime', 'asc')
    );

    const unsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
            const posts: SocialMediaPost[] = snapshot.docs.map((doc) => {
                const data = convertTimestampToDate(doc.data()) as SocialMediaPost;
                return { ...data, id: doc.id };
            });
            postsStore.set(posts);
            loadingPosts.set(false);
        },
        (error) => {
            console.error('Error fetching posts:', error);
            loadingPosts.set(false);
        }
    );

    return unsubscribe;
};

// Create a new post
export const createPost = async (post: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        const now = new Date();
        const postData = {
            ...post,
            userId,
            createdAt: now,
            updatedAt: now
        };

        const convertedData = convertDateToTimestamp(postData);
        const docRef = await addDoc(collection(db, 'posts'), convertedData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

// Update an existing post
export const updatePost = async (id: string, updates: Partial<SocialMediaPost>): Promise<void> => {
    try {
        const updatedData = {
            ...updates,
            updatedAt: new Date()
        };

        const convertedData = convertDateToTimestamp(updatedData);
        await updateDoc(doc(db, 'posts', id), convertedData);
    } catch (error) {
        console.error('Error updating post:', error);
        throw error;
    }
};

// Delete a post
export const deletePost = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, 'posts', id));
    } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
    }
};

// Get post by ID
export const getPostById = async (id: string): Promise<SocialMediaPost | null> => {
    try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        const data = convertTimestampToDate(docSnap.data()) as SocialMediaPost;
        return { ...data, id: docSnap.id };
    } catch (error) {
        console.error('Error getting post:', error);
        throw error;
    }
};

// Filter posts by criteria
export const filterPosts = async (
    platforms?: PlatformType[],
    status?: PostStatus[],
    startDate?: Date,
    endDate?: Date
): Promise<SocialMediaPost[]> => {
    try {
        const auth = getAuth();
        const userId = auth.currentUser?.uid;

        if (!userId) {
            throw new Error('User not authenticated');
        }

        let q = query(collection(db, 'posts'), where('userId', '==', userId));

        // We need to fetch all posts and filter client-side for platforms
        // since Firebase doesn't support direct array-contains-any with additional filters

        if (status && status.length > 0) {
            q = query(q, where('status', 'in', status));
        }

        if (startDate && endDate) {
            q = query(
                q,
                where('scheduledTime', '>=', Timestamp.fromDate(startDate)),
                where('scheduledTime', '<=', Timestamp.fromDate(endDate))
            );
        }

        const querySnapshot = await getDocs(q);
        const posts: SocialMediaPost[] = querySnapshot.docs.map((doc) => {
            const data = convertTimestampToDate(doc.data()) as SocialMediaPost;
            return { ...data, id: doc.id };
        });

        // Client-side filtering for platforms if specified
        if (platforms && platforms.length > 0) {
            return posts.filter((post) =>
                post.platforms.some(platform => platforms.includes(platform))
            );
        }

        return posts;
    } catch (error) {
        console.error('Error filtering posts:', error);
        throw error;
    }
};

// Convert posts to calendar events
export const postsToCalendarEvents = (posts: SocialMediaPost[]): CalendarEvent[] => {
    return posts.map(post => {
        // Determine color based on primary platform
        const platformColors: Record<PlatformType, string> = {
            twitter: '#1DA1F2',
            instagram: '#E1306C',
            facebook: '#4267B2',
            linkedin: '#0077B5'
        };

        const primaryPlatform = post.platforms[0] || 'twitter';
        const platformColor = platformColors[primaryPlatform];

        return {
            id: post.id,
            postId: post.id,
            title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
            start: post.scheduledTime,
            end: new Date(post.scheduledTime.getTime() + 30 * 60000), // Default 30 min duration
            allDay: false,
            platformColor,
            status: post.status,
            userId: post.userId
        };
    });
};

// Subscribe to calendar events (derived from posts)
export const subscribeToCalendarEvents = (): (() => void) => {
    if (!browser) return () => { };

    // Use the existing posts store to derive calendar events
    const unsubscribe = postsStore.subscribe((posts) => {
        const events = postsToCalendarEvents(posts);
        calendarEventsStore.set(events);
    });

    return unsubscribe;
};

// Reschedule a post (update its scheduled time)
export const reschedulePost = async (postId: string, newScheduledTime: Date): Promise<void> => {
    try {
        await updatePost(postId, {
            scheduledTime: newScheduledTime,
            status: 'scheduled' // Ensure status is set to scheduled when rescheduling
        });
    } catch (error) {
        console.error('Error rescheduling post:', error);
        throw error;
    }
};