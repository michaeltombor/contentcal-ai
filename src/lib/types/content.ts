// src/lib/types/content.ts

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type ContentType = 'text' | 'image' | 'video' | 'link' | 'carousel';

export interface Content {
    id: string;
    userId: string;
    title: string;
    description?: string;
    status: ContentStatus;
    type: ContentType;
    platforms: ContentPlatform[];
    mediaUrls?: string[];
    tags?: string[];
    createdAt: Date | string;
    updatedAt: Date | string;
    scheduledFor?: Date | string;
    publishedAt?: Date | string;
    analytics?: ContentAnalytics;
}

export interface ContentPlatform {
    platform: string;
    status: ContentStatus;
    platformPostId?: string;
    errorMessage?: string;
    publishedUrl?: string;
}

export interface ContentAnalytics {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    clicks?: number;
    impressions?: number;
    engagement?: number;
    lastUpdated: Date | string;
}

export interface ContentCalendarItem {
    id: string;
    title: string;
    status: ContentStatus;
    scheduledFor: Date | string;
    platforms: string[];
    type: ContentType;
}