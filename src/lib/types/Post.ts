// src/lib/types/Post.ts
// Import the PlatformType from your calendar types
import type { PlatformType } from '$lib/types/calendar';

export interface Post {
    id: string;
    userId: string;
    title: string;
    content: string;
    scheduledTime: Date; // Changed from string to Date to match SocialMediaPost
    platforms: PlatformType[]; // Using PlatformType instead of string[]
    mediaUrls?: string[];
    tags?: string[];
    status: 'draft' | 'scheduled' | 'published' | 'failed';
    createdAt?: any; // Firestore timestamp
    updatedAt?: any; // Firestore timestamp
}