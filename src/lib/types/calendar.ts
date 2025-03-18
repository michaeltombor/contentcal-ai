// src/lib/types/calendar.ts

// Platform types
export type PlatformType = 'twitter' | 'instagram' | 'facebook' | 'linkedin';

// Post status types
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

// Interface for social media posts
export interface SocialMediaPost {
    id: string;
    userId: string;
    content: string;
    scheduledTime: Date;
    platforms: PlatformType[];
    mediaUrls?: string[];
    hashtags?: string[];
    status: PostStatus;
    createdAt: Date;
    updatedAt: Date;
    analytics?: {
        impressions?: number;
        engagements?: number;
        clicks?: number;
    };
}

// Interface for calendar events (derived from posts)
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

// Calendar view state interface
export interface CalendarViewState {
    currentView: 'day' | 'week' | 'month';
    currentDate: Date;
    selectedEvent?: CalendarEvent;
    selectedPost?: SocialMediaPost;
    draggedEvent?: CalendarEvent;
    isCreatingEvent: boolean;
}

// Calendar filters interface
export interface CalendarFilters {
    platforms: PlatformType[];
    status: PostStatus[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    searchTerm?: string;
}