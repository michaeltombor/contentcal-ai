// src/lib/types/user.ts

export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    plan: 'free' | 'pro' | 'enterprise';
    role: 'user' | 'admin';
}

export interface UserProfile extends User {
    bio?: string;
    location?: string;
    website?: string;
    socialAccounts: SocialAccount[];
}

export interface SocialAccount {
    id: string;
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest';
    accountName: string;
    accountId: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiry?: Date | string;
    isConnected: boolean;
    profileImageUrl?: string;
}