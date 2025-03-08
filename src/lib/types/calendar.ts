// src/lib/types/calendar.ts

export type PlatformType = 'twitter' | 'instagram' | 'facebook' | 'linkedin';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface SocialMediaPost {
    id: string;
    userId: string;
    content: string;
    mediaUrls?: string[];
    platforms: PlatformType[];
    scheduledTime: Date;
    status: PostStatus;
    createdAt: Date;
    updatedAt: Date;
    hashtags?: string[];
    aiGenerated?: boolean;
    engagement?: {
        likes: number;
        shares: number;
        comments: number;
        clicks: number;
    };
    metadata?: Record<string, unknown>;
}

export interface CalendarEvent {
    id: string;
    postId: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    platformColor: string;
    status: PostStatus;
    userId: string;
}

export interface CalendarViewState {
    currentView: 'day' | 'week' | 'month';
    currentDate: Date;
    selectedEvent?: CalendarEvent;
    selectedPost?: SocialMediaPost;
    isCreatingEvent: boolean;
    draggedEvent?: CalendarEvent;
}

export interface CalendarFilters {
    platforms: PlatformType[];
    status: PostStatus[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    searchTerm?: string;
}