import { storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a single file to Firebase Storage
 * @param file The file to upload
 * @param path The storage path to upload to
 * @returns Promise resolving to the download URL
 */
export async function uploadFile(file: File, path: string): Promise<string> {
    if (!storage) {
        throw new Error('Firebase storage is not initialized.');
    }

    try {
        // Create a unique filename to prevent collisions
        const fileExtension = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const storageRef = ref(storage, `${path}/${fileName}`);

        // Upload the file
        await uploadBytes(storageRef, file);

        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

/**
 * Upload multiple media files to Firebase Storage
 * @param files The files to upload
 * @param userId The ID of the user uploading the files
 * @returns Promise resolving to an array of download URLs
 */
export async function uploadMediaFiles(files: FileList, userId: string): Promise<string[]> {
    if (!storage) {
        throw new Error('Firebase storage is not initialized.');
    }

    const uploadPromises = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        uploadPromises.push(uploadFile(file, `users/${userId}/media`));
    }

    return Promise.all(uploadPromises);
}

/**
 * Delete a file from Firebase Storage by URL
 * @param url The download URL of the file to delete
 */
export async function deleteFileByUrl(url: string): Promise<void> {
    if (!storage) {
        throw new Error('Firebase storage is not initialized.');
    }

    try {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}