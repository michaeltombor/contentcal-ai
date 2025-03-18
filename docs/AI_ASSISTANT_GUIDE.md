# ContentCal.AI Assistant Guide

## Project Overview
ContentCal.AI is a SvelteKit/TypeScript application with Firebase backend for social media management. Users can schedule, create, and analyze social media content with AI-assisted features.

## Directory Structure
```
contentcal-ai/
├── src/
│   ├── lib/                    # Shared components & utilities
│   │   ├── components/         # Reusable UI components
│   │   ├── stores/             # Svelte stores (auth, settings, etc.)
│   │   ├── services/           # API services
│   │   ├── utils/              # Helper functions
│   │   ├── types/              # TypeScript interfaces & types
│   │   └── firebase.ts         # Firebase configuration
│   ├── routes/                 # SvelteKit pages/routes
│   │   ├── +layout.svelte      # Main app layout
│   │   ├── +page.svelte        # Homepage
│   │   ├── login/              # Authentication pages
│   │   ├── calendar/           # Content calendar feature
│   │   ├── analytics/          # Analytics dashboard
│   │   └── settings/           # User & team settings
├── functions/                  # Firebase Cloud Functions
│   └── src/
│       └── index.ts            # Cloud Functions implementation
├── static/                     # Static assets
├── firestore.rules             # Firestore security rules
├── storage.rules               # Storage security rules
└── firebase.json               # Firebase configuration
```

## Naming Conventions
- **Components**: PascalCase (e.g., `CalendarView.svelte`, `PostCard.svelte`)
- **Stores**: camelCase with `Store` suffix (e.g., `authStore.ts`, `settingsStore.ts`)
- **Services**: camelCase with `Service` suffix (e.g., `postService.ts`)
- **Utility functions**: camelCase (e.g., `formatDate.ts`, `validateInput.ts`)
- **Types/Interfaces**: PascalCase, prefixed with 'I' for interfaces (e.g., `IPost`, `IUser`, `PostStatus`)

## Key Interfaces & Types

### User-related
```typescript
interface IUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  role: UserRole;
  settings: UserSettings;
  teamIds: string[];
}

enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

interface UserSettings {
  tonePreference: string;
  industry: string;
  timezone: string;
  emailNotifications: boolean;
}
```

### Post-related
```typescript
interface IPost {
  id?: string;
  userId: string;
  teamId?: string;
  content: string;
  mediaUrls?: string[];
  platforms: SocialPlatform[];
  scheduledTime: Date | firebase.firestore.Timestamp;
  status: PostStatus;
  createdAt: Date | firebase.firestore.Timestamp;
  updatedAt: Date | firebase.firestore.Timestamp;
  hashtags?: string[];
  aiGenerated?: boolean;
  engagement?: PostEngagement;
}

enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  FAILED = 'failed'
}

enum SocialPlatform {
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin'
}

interface PostEngagement {
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
}
```

## Implemented Functionality

### Authentication
- Firebase authentication with email/password and Google OAuth
- User registration, login, logout, password reset
- User profiles with display name and profile picture

### Content Calendar
- Interactive calendar view for posts (daily, weekly, monthly views)
- Drag-and-drop post scheduling
- Post creation with rich text editor
- Platform-specific post preview
- Bulk scheduling options

### Social Media Integration
- Twitter API integration for posting and analytics
- Platform-specific post formatting
- Social account connection and management

### AI Features
- Content suggestions based on industry and tone preferences
- Hashtag recommendations
- Best time to post recommendations
- Content performance analysis

### Team Collaboration
- Team creation and management
- Role-based permissions
- Shared content calendar
- Approval workflows for posts

## Files to Reference
- `src/lib/types/index.ts` - Core type definitions
- `src/lib/stores/authStore.ts` - Authentication state management
- `src/lib/services/postService.ts` - Post CRUD operations
- `src/routes/calendar/components/PostCreateModal.svelte` - Post creation UI

## Common Variable Names
- `user` or `currentUser` - The authenticated user
- `posts` - Array of social media posts
- `platforms` - Social media platforms
- `selectedDate` - Currently selected date in calendar
- `isLoading` - Loading state boolean
- `handleSubmit` - Form submission handler
- `togglePlatform` - Function to toggle platform selection

## Design System
- Using TailwindCSS for styling
- Color scheme: primary (#4f46e5), secondary (#a855f7), accent (#ec4899)
- Components follow a consistent pattern with props validation
