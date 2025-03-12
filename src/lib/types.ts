export interface Post {
    id: string;
    userId: string;
    title: string;
    content: string;
    scheduledDate: Date;
    platform: SocialPlatform;
    status: PostStatus;
    tags?: string[];
    mediaUrls?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export enum SocialPlatform {
    Twitter = 'twitter',
    Facebook = 'facebook',
    Instagram = 'instagram',
    LinkedIn = 'linkedin',
    Pinterest = 'pinterest',
    TikTok = 'tiktok'
}

export enum PostStatus {
    Draft = 'draft',
    Scheduled = 'scheduled',
    Published = 'published',
    Failed = 'failed'
}

export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    emailVerified: boolean;
    preferences?: UserPreferences;
    createdAt?: Date;
}

export interface UserPreferences {
    defaultView: 'day' | 'week' | 'month';
    defaultPlatform: SocialPlatform;
    notificationsEnabled: boolean;
}