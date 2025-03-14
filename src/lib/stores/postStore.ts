// src/lib/stores/postStore.ts
import { writable } from 'svelte/store';
import type { Post } from '$lib/types/Post.ts';
import {
    createPost,
    updatePost,
    deletePost,
    getPostById,
    reschedulePost as reschedulePostService
} from '$lib/services/postService';
import { get, derived } from 'svelte/store';


// Create auth store reference - make sure this matches your actual auth store
// This should point to where you have your auth user management
import { user } from '$lib/stores/authStore';

/**
 * Convert ISO string dates to Date objects when using the store
 */
function convertDateStringsToDateObjects(post: any): Post {
    return {
        ...post,
        scheduledTime: post.scheduledTime instanceof Date
            ? post.scheduledTime
            : new Date(post.scheduledTime)
    };
}


function createPostStore() {
    const { subscribe, set, update } = writable<{
        posts: Post[];
        loading: boolean;
        error: string | null;
    }>({
        posts: [],
        loading: false,
        error: null
    });

    return {
        subscribe,

        loadPosts: async () => {
            const currentUser = get(user);
            if (!currentUser) return;

            update(state => ({ ...state, loading: true, error: null }));

            try {
                // Using your existing postsStore from postService.ts instead of calling getPosts
                // This assumes you're subscribing to posts elsewhere
                // If needed, add a function to load posts directly here

                update(state => ({ ...state, loading: false }));
            } catch (error) {
                console.error('Error loading posts:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to load posts. Please try again.'
                }));
            }
        },

        addPost: async (newPost: Omit<Post, 'id'>) => {
            update(state => ({ ...state, loading: true, error: null }));

            try {
                // Convert scheduledTime to Date
                const postToCreate = {
                    ...newPost,
                    scheduledTime: new Date(newPost.scheduledTime)
                };

                // Use your existing createPost function
                const postId = await createPost(newPost);

                // Get the created post
                const post = await getPostById(postId);

                if (post) {
                    update(state => ({
                        ...state,
                        posts: [...state.posts, post as unknown as Post],
                        loading: false
                    }));
                }

                return postId;
            } catch (error) {
                console.error('Error adding post:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to add post. Please try again.'
                }));
                return null;
            }
        },

        updatePost: async (postId: string, updatedData: Partial<Post>) => {
            update(state => ({ ...state, loading: true, error: null }));

            try {
                await updatePost(postId, updatedData);

                update(state => ({
                    ...state,
                    posts: state.posts.map(post =>
                        post.id === postId
                            ? { ...post, ...updatedData }
                            : post
                    ),
                    loading: false
                }));

                return true;
            } catch (error) {
                console.error('Error updating post:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to update post. Please try again.'
                }));
                return false;
            }
        },

        reschedulePost: async (postId: string, newScheduledTime: Date) => {
            update(state => ({ ...state, loading: true, error: null }));

            try {
                await reschedulePostService(postId, newScheduledTime);

                update(state => ({
                    ...state,
                    posts: state.posts.map(post =>
                        post.id === postId
                            ? { ...post, scheduledTime: newScheduledTime } // Store the Date object, not a string
                            : post
                    ),
                    loading: false
                }));

                return true;
            } catch (error) {
                console.error('Error rescheduling post:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to reschedule post. Please try again.'
                }));
                return false;
            }
        },

        deletePost: async (postId: string) => {
            update(state => ({ ...state, loading: true, error: null }));

            try {
                await deletePost(postId);

                update(state => ({
                    ...state,
                    posts: state.posts.filter(post => post.id !== postId),
                    loading: false
                }));

                return true;
            } catch (error) {
                console.error('Error deleting post:', error);
                update(state => ({
                    ...state,
                    loading: false,
                    error: 'Failed to delete post. Please try again.'
                }));
                return false;
            }
        },

        reset: () => {
            set({ posts: [], loading: false, error: null });
        }
    };
}

export const postStore = createPostStore();


export const postStoreLoading = derived(
    postStore,
    $postStore => $postStore.loading
);

// Subscribe to auth changes - adjust this based on your actual auth implementation
// This might need to be changed depending on how your auth store is structured
user.subscribe(authState => {
    if (authState && !get(postStoreLoading)) {
        postStore.loadPosts();
    } else if (!authState) {
        postStore.reset();
    }
});