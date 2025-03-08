// src/lib/services/contentService.ts
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const db = getFirestore();
const storage = getStorage();
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { Content, ContentType, ContentStatus } from '$lib/types/content';

const CONTENT_COLLECTION = 'content';

// Create new content
export async function createContent(
    userId: string,
    title: string,
    description: string = '',
    type: ContentType = 'text',
    platforms: string[] = [],
    scheduledFor?: Date
): Promise<string> {
    try {
        const newContent: Partial<Content> = {
            userId,
            title,
            description,
            type,
            platforms: platforms.map(platform => ({
                platform,
                status: 'draft'
            })),
            status: 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
            scheduledFor: scheduledFor ? scheduledFor : undefined,
            mediaUrls: []
        };

        const docRef = await addDoc(collection(db, CONTENT_COLLECTION), newContent);
        return docRef.id;
    } catch (error) {
        console.error('Error creating content:', error);
        throw error;
    }
}

// Get content by ID
export async function getContentById(contentId: string): Promise<Content | null> {
    try {
        const docRef = doc(db, CONTENT_COLLECTION, contentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Content;
        }
        return null;
    } catch (error) {
        console.error('Error getting content:', error);
        throw error;
    }
}

// Get all content for user
export async function getUserContent(userId: string): Promise<Content[]> {
    try {
        const q = query(
            collection(db, CONTENT_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const content: Content[] = [];

        querySnapshot.forEach((doc) => {
            content.push({ id: doc.id, ...doc.data() } as Content);
        });

        return content;
    } catch (error) {
        console.error('Error getting user content:', error);
        throw error;
    }
}

// Get scheduled content
export async function getScheduledContent(userId: string): Promise<Content[]> {
    try {
        const q = query(
            collection(db, CONTENT_COLLECTION),
            where('userId', '==', userId),
            where('status', '==', 'scheduled'),
            orderBy('scheduledFor', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const content: Content[] = [];

        querySnapshot.forEach((doc) => {
            content.push({ id: doc.id, ...doc.data() } as Content);
        });

        return content;
    } catch (error) {
        console.error('Error getting scheduled content:', error);
        throw error;
    }
}

// Update content
export async function updateContent(contentId: string, updates: Partial<Content>): Promise<void> {
    try {
        const docRef = doc(db, CONTENT_COLLECTION, contentId);
        // Add updatedAt timestamp
        updates.updatedAt = new Date().toISOString();

        await updateDoc(docRef, updates);
    } catch (error) {
        console.error('Error updating content:', error);
        throw error;
    }
}

// Delete content
export async function deleteContent(contentId: string): Promise<void> {
    try {
        // Get the content to delete associated media
        const content = await getContentById(contentId);

        // Delete the document
        await deleteDoc(doc(db, CONTENT_COLLECTION, contentId));

        // Delete associated media if exists
        if (content?.mediaUrls && content.mediaUrls.length > 0) {
            await Promise.all(content.mediaUrls.map(async (url) => {
                const mediaRef = ref(storage, url);
                try {
                    await deleteObject(mediaRef);
                } catch (error) {
                    console.error('Error deleting media file:', error);
                }
            }));
        }
    } catch (error) {
        console.error('Error deleting content:', error);
        throw error;
    }
}

// Update content status
export async function updateContentStatus(contentId: string, status: ContentStatus): Promise<void> {
    try {
        await updateContent(contentId, { status });
    } catch (error) {
        console.error('Error updating content status:', error);
        throw error;
    }
}

// Upload media for content
export async function uploadMedia(
    contentId: string,
    file: File
): Promise<string> {
    try {
        // Create a reference to the file location
        const filePath = `content/${contentId}/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, filePath);

        // Upload the file
        await uploadBytes(fileRef, file);

        // Get download URL
        const downloadURL = await getDownloadURL(fileRef);

        // Get current content
        const content = await getContentById(contentId);

        if (content) {
            // Add URL to content's mediaUrls array
            const mediaUrls = content.mediaUrls || [];
            mediaUrls.push(downloadURL);

            // Update content with new mediaUrl
            await updateContent(contentId, { mediaUrls });
        }

        return downloadURL;
    } catch (error) {
        console.error('Error uploading media:', error);
        throw error;
    }
}