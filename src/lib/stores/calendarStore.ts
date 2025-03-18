// src/lib/stores/calendarStore.ts
import { writable, derived, get } from 'svelte/store';
import type { SocialMediaPost, CalendarEvent } from '$lib/types/calendar';
import { reschedulePost } from '$lib/services/postService';
import { toastStore } from './toastStore';

// Calendar view types
export type CalendarViewType = 'day' | 'week' | 'month';

// Interface for the calendar view state
interface CalendarState {
    currentDate: Date;
    currentView: CalendarViewType;
    selectedEvent: CalendarEvent | null;
    selectedPost: SocialMediaPost | null;
    draggedEvent: CalendarEvent | null;
    filters: {
        platforms: string[];
        status: string[];
        dateRange: {
            start: Date | null;
            end: Date | null;
        };
    };
}

// Create the calendar state store
const createCalendarStore = () => {
    // Initialize with default values
    const initialState: CalendarState = {
        currentDate: new Date(),
        currentView: 'month',
        selectedEvent: null,
        selectedPost: null,
        draggedEvent: null,
        filters: {
            platforms: [],
            status: [],
            dateRange: {
                start: null,
                end: null
            }
        }
    };

    const { subscribe, update, set } = writable<CalendarState>(initialState);

    return {
        subscribe,
        set,
        // Update the current date
        setCurrentDate: (date: Date) => update(state => ({ ...state, currentDate: date })),

        // Navigate to today
        navigateToToday: () => update(state => ({ ...state, currentDate: new Date() })),

        // Navigate to the previous period (day, week, or month)
        navigateToPrevious: () => update(state => {
            const newDate = new Date(state.currentDate);
            if (state.currentView === 'day') {
                newDate.setDate(newDate.getDate() - 1);
            } else if (state.currentView === 'week') {
                newDate.setDate(newDate.getDate() - 7);
            } else {
                newDate.setMonth(newDate.getMonth() - 1);
            }
            return { ...state, currentDate: newDate };
        }),

        // Navigate to the next period (day, week, or month)
        navigateToNext: () => update(state => {
            const newDate = new Date(state.currentDate);
            if (state.currentView === 'day') {
                newDate.setDate(newDate.getDate() + 1);
            } else if (state.currentView === 'week') {
                newDate.setDate(newDate.getDate() + 7);
            } else {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return { ...state, currentDate: newDate };
        }),

        // Change the calendar view (day, week, month)
        changeView: (view: CalendarViewType) => update(state => ({ ...state, currentView: view })),

        // Select an event
        selectEvent: (event: CalendarEvent) => update(state => ({
            ...state,
            selectedEvent: event,
            // This would typically fetch the full post from the posts store
            // For now, we'll set it to null and handle it with a derived store
            selectedPost: null
        })),

        // Clear the current selection
        clearSelection: () => update(state => ({
            ...state,
            selectedEvent: null,
            selectedPost: null
        })),

        // Set filters
        setFilters: (filters: Partial<CalendarState['filters']>) => update(state => ({
            ...state,
            filters: {
                ...state.filters,
                ...filters
            }
        })),

        // Start dragging an event
        startDrag: (event: CalendarEvent) => update(state => ({
            ...state,
            draggedEvent: event
        })),

        // Clear dragged event
        clearDrag: () => update(state => ({
            ...state,
            draggedEvent: null
        })),

        // Handle dropping an event on a new date/time
        handleDrop: async (date: Date, allDay: boolean) => {
            try {
                const state = get({ subscribe });
                const draggedEvent = state.draggedEvent;

                if (!draggedEvent) {
                    console.warn('No event being dragged');
                    return;
                }

                // Calculate the new scheduled time
                const newScheduledTime = new Date(date);

                if (!allDay) {
                    // Preserve the original time of day if not dropping on "all day" area
                    const originalDate = draggedEvent.start;
                    newScheduledTime.setHours(originalDate.getHours());
                    newScheduledTime.setMinutes(originalDate.getMinutes());
                } else {
                    // Set to beginning of day if dropping on "all day" area
                    newScheduledTime.setHours(9, 0, 0, 0); // Default to 9 AM
                }

                // Update the post in the database
                await reschedulePost(draggedEvent.postId, newScheduledTime);

                // Show success toast
                toastStore.addToast({
                    type: 'success',
                    message: 'Post rescheduled successfully',
                    duration: 3000
                });

                // Clear the dragged event
                update(state => ({
                    ...state,
                    draggedEvent: null
                }));
            } catch (error) {
                console.error('Error during handleDrop:', error);

                // Show error toast
                toastStore.addToast({
                    type: 'error',
                    message: 'Failed to reschedule post',
                    duration: 5000
                });

                // Clear the dragged event
                update(state => ({
                    ...state,
                    draggedEvent: null
                }));
            }
        }
    };
};

// Create the main calendar store
export const calendarViewState = createCalendarStore();

// Create a derived store for filtered events
// This will automatically update whenever the calendarEvents or filters change
export const filteredEvents = derived(
    [calendarViewState],
    ([$calendarViewState]) => {
        // This is a placeholder. You would typically derive this from your posts/events store
        // and apply the filters from calendarViewState
        return []; // Replace with your actual filtering logic
    }
);

// Export all store functions
export const {
    navigateToToday,
    navigateToPrevious,
    navigateToNext,
    changeView,
    selectEvent,
    clearSelection,
    startDrag,
    handleDrop
} = calendarViewState;