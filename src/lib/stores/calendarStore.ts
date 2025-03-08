// src/lib/stores/calendarStore.ts

import { writable, derived, get } from 'svelte/store';
import type { CalendarViewState, CalendarEvent, CalendarFilters, SocialMediaPost, PlatformType, PostStatus } from '$lib/types/calendar';
import { postsStore, calendarEventsStore, reschedulePost } from '$lib/services/postService';

// Create writable stores
export const calendarViewState = writable<CalendarViewState>({
    currentView: 'month',
    currentDate: new Date(),
    isCreatingEvent: false
});

export const calendarFilters = writable<CalendarFilters>({
    platforms: ['twitter', 'instagram', 'facebook', 'linkedin'],
    status: ['draft', 'scheduled', 'published', 'failed']
});

// Derived store for filtered events
export const filteredEvents = derived(
    [calendarEventsStore, calendarFilters],
    ([$calendarEvents, $calendarFilters]) => {
        return $calendarEvents.filter(event => {
            // Get the corresponding post to check platforms
            const post = get(postsStore).find(p => p.id === event.postId);

            if (!post) return false;

            // Filter by platform
            const platformMatch = $calendarFilters.platforms.length === 0 ||
                post.platforms.some(platform => $calendarFilters.platforms.includes(platform));

            // Filter by status
            const statusMatch = $calendarFilters.status.length === 0 ||
                $calendarFilters.status.includes(event.status);

            // Filter by date range
            const dateRangeMatch = !$calendarFilters.dateRange ||
                (event.start >= $calendarFilters.dateRange.start &&
                    event.start <= $calendarFilters.dateRange.end);

            // Filter by search term
            const searchMatch = !$calendarFilters.searchTerm ||
                event.title.toLowerCase().includes($calendarFilters.searchTerm.toLowerCase());

            return platformMatch && statusMatch && dateRangeMatch && searchMatch;
        });
    }
);

// Calendar navigation functions
export const navigateToToday = (): void => {
    calendarViewState.update(state => ({
        ...state,
        currentDate: new Date()
    }));
};

export const navigateToPrevious = (): void => {
    calendarViewState.update(state => {
        const current = new Date(state.currentDate);

        if (state.currentView === 'day') {
            current.setDate(current.getDate() - 1);
        } else if (state.currentView === 'week') {
            current.setDate(current.getDate() - 7);
        } else if (state.currentView === 'month') {
            current.setMonth(current.getMonth() - 1);
        }

        return {
            ...state,
            currentDate: current
        };
    });
};

export const navigateToNext = (): void => {
    calendarViewState.update(state => {
        const current = new Date(state.currentDate);

        if (state.currentView === 'day') {
            current.setDate(current.getDate() + 1);
        } else if (state.currentView === 'week') {
            current.setDate(current.getDate() + 7);
        } else if (state.currentView === 'month') {
            current.setMonth(current.getMonth() + 1);
        }

        return {
            ...state,
            currentDate: current
        };
    });
};

export const changeView = (view: 'day' | 'week' | 'month'): void => {
    calendarViewState.update(state => ({
        ...state,
        currentView: view
    }));
};

// Calendar event selection
export const selectEvent = (event: CalendarEvent): void => {
    calendarViewState.update(state => ({
        ...state,
        selectedEvent: event,
        // Also find and select the corresponding post
        selectedPost: get(postsStore).find(post => post.id === event.postId)
    }));
};

export const clearSelection = (): void => {
    calendarViewState.update(state => ({
        ...state,
        selectedEvent: undefined,
        selectedPost: undefined
    }));
};

// Update filters
export const updatePlatformFilters = (platforms: PlatformType[]): void => {
    calendarFilters.update(filters => ({
        ...filters,
        platforms
    }));
};

export const updateStatusFilters = (status: PostStatus[]): void => {
    calendarFilters.update(filters => ({
        ...filters,
        status
    }));
};

export const updateDateRangeFilter = (start: Date, end: Date): void => {
    calendarFilters.update(filters => ({
        ...filters,
        dateRange: { start, end }
    }));
};

export const updateSearchFilter = (searchTerm: string): void => {
    calendarFilters.update(filters => ({
        ...filters,
        searchTerm
    }));
};

export const clearFilters = (): void => {
    calendarFilters.set({
        platforms: ['twitter', 'instagram', 'facebook', 'linkedin'],
        status: ['draft', 'scheduled', 'published', 'failed']
    });
};

// Drag and drop handlers
export const startDrag = (event: CalendarEvent): void => {
    calendarViewState.update(state => ({
        ...state,
        draggedEvent: event
    }));
};

export const endDrag = (): void => {
    calendarViewState.update(state => ({
        ...state,
        draggedEvent: undefined
    }));
};

export const handleDrop = async (date: Date, allDay: boolean = false): Promise<void> => {
    const state = get(calendarViewState);
    if (!state.draggedEvent) return;

    try {
        // Calculate new time while preserving hours and minutes if not all day
        const newDate = new Date(date);
        if (!allDay) {
            const originalDate = state.draggedEvent.start;
            newDate.setHours(originalDate.getHours());
            newDate.setMinutes(originalDate.getMinutes());
        } else {
            // If dropped as all-day event, set to beginning of day
            newDate.setHours(9, 0, 0, 0); // Default to 9 AM
        }

        // Update in Firestore
        await reschedulePost(state.draggedEvent.postId, newDate);

        endDrag();
    } catch (error) {
        console.error('Error handling drop:', error);
        throw error;
    }
};