// src/lib/stores/toastStore.ts
// Move toast functionality to a store file (not a route file)

import { writable } from 'svelte/store';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    timeout: number;
}

function createToastStore() {
    const { subscribe, update } = writable<Toast[]>([]);

    function add(toast: Omit<Toast, 'id'>) {
        const id = Date.now().toString();
        update(toasts => [{ ...toast, id }, ...toasts]);

        if (toast.timeout) {
            setTimeout(() => {
                remove(id);
            }, toast.timeout);
        }

        return id;
    }

    function remove(id: string) {
        update(toasts => toasts.filter(t => t.id !== id));
    }

    function success(message: string, timeout = 3000) {
        return add({ message, type: 'success', timeout });
    }

    function error(message: string, timeout = 3000) {
        return add({ message, type: 'error', timeout });
    }

    function info(message: string, timeout = 3000) {
        return add({ message, type: 'info', timeout });
    }

    function warning(message: string, timeout = 3000) {
        return add({ message, type: 'warning', timeout });
    }

    return {
        subscribe,
        add,
        remove,
        success,
        error,
        info,
        warning
    };
}

export const toast = createToastStore();