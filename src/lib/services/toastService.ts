// src/lib/services/toastService.ts

import { writable, type Writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
    dismissible: boolean;
}

// Create a writable store for toast notifications
export const toasts: Writable<Toast[]> = writable([]);

// Generate a unique ID for each toast
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

// Add a new toast notification
export function addToast(
    message: string,
    type: ToastType = 'info',
    duration: number = 5000,
    dismissible: boolean = true
): string {
    const id = generateId();

    const toast: Toast = {
        id,
        message,
        type,
        duration,
        dismissible
    };

    toasts.update(all => [toast, ...all]);

    if (duration > 0) {
        setTimeout(() => {
            dismissToast(id);
        }, duration);
    }

    return id;
}

// Convenience methods for different toast types
export const showSuccess = (message: string, duration?: number): string =>
    addToast(message, 'success', duration);

export const showError = (message: string, duration?: number): string =>
    addToast(message, 'error', duration);

export const showWarning = (message: string, duration?: number): string =>
    addToast(message, 'warning', duration);

export const showInfo = (message: string, duration?: number): string =>
    addToast(message, 'info', duration);

// Dismiss a specific toast by ID
export function dismissToast(id: string): void {
    toasts.update(all => all.filter(t => t.id !== id));
}

// Dismiss all toast notifications
export function dismissAllToasts(): void {
    toasts.set([]);
}