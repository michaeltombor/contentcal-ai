// src/lib/stores/toastStore.ts
import { writable } from 'svelte/store';
import { v4 as uuidv4 } from 'uuid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    timeout: number;
}

// Initialize the toast store
const createToastStore = () => {
    const { subscribe, update } = writable<Toast[]>([]);

    // Remove a toast by ID
    const remove = (id: string) => {
        update(toasts => toasts.filter(toast => toast.id !== id));
    };

    // Add a new toast
    const add = (message: string, type: ToastType = 'info', timeout = 3000) => {
        const id = uuidv4();

        update(toasts => [
            ...toasts,
            { id, message, type, timeout }
        ]);

        // Auto-remove toast after timeout
        if (timeout > 0) {
            setTimeout(() => {
                remove(id);
            }, timeout);
        }

        return id;
    };

    // Helper methods for different toast types
    const success = (message: string, timeout = 3000) => add(message, 'success', timeout);
    const error = (message: string, timeout = 5000) => add(message, 'error', timeout);
    const info = (message: string, timeout = 3000) => add(message, 'info', timeout);
    const warning = (message: string, timeout = 4000) => add(message, 'warning', timeout);

    return {
        subscribe,
        add,
        remove,
        success,
        error,
        info,
        warning
    };
};

// Export the toast store as a singleton
export const toast = createToastStore();