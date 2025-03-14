// src/lib/stores/toastStore.ts
import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    timeout?: number; // Auto-dismiss timeout in milliseconds
}

function createToastStore() {
    const { subscribe, update } = writable<Toast[]>([]);

    function addToast(message: string, type: ToastType = 'info', timeout: number = 3000): string {
        const id = Math.random().toString(36).substring(2, 9);

        update(toasts => [...toasts, { id, message, type, timeout }]);

        if (timeout) {
            setTimeout(() => {
                removeToast(id);
            }, timeout);
        }

        return id;
    }

    function removeToast(id: string): void {
        update(toasts => toasts.filter(toast => toast.id !== id));
    }

    function success(message: string, timeout: number = 3000): string {
        return addToast(message, 'success', timeout);
    }

    function error(message: string, timeout: number = 5000): string {
        return addToast(message, 'error', timeout);
    }

    function info(message: string, timeout: number = 3000): string {
        return addToast(message, 'info', timeout);
    }

    function warning(message: string, timeout: number = 4000): string {
        return addToast(message, 'warning', timeout);
    }

    return {
        subscribe,
        add: addToast,
        remove: removeToast,
        success,
        error,
        info,
        warning,
        clear: () => update(() => [])
    };
}

export const toastStore = createToastStore();