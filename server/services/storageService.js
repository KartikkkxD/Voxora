import { supabase } from './supabaseClient.js';
import fs from 'fs';

/**
 * Uploads a local file to the private Supabase storage bucket 'audio-recordings'.
 * Scopes files under user-specific subfolders (e.g. userId/unique-filename).
 * 
 * @param {string} localFilePath Local path of the file on disk
 * @param {string} userId User UUID
 * @param {string} originalName Original name of the uploaded file
 * @param {string} mimetype Mime type of the file
 * @returns {Promise<string>} Stored relative file path
 */
export const uploadAudioToStorage = async (localFilePath, userId, originalName, mimetype) => {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File not found for storage upload: ${localFilePath}`);
  }

  const fileBuffer = fs.readFileSync(localFilePath);
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e4);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${userId}/${uniqueSuffix}-${sanitizedName}`;

  console.info(`[StorageService] Uploading file to bucket 'audio-recordings' path: ${storagePath}`);

  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .upload(storagePath, fileBuffer, {
      contentType: mimetype,
      upsert: true
    });

  if (error) {
    console.error('[StorageService] Supabase storage upload error:', error);
    throw error;
  }

  return data.path; // e.g. "userId/170000000-filename.webm"
};

/**
 * Generates a temporary signed URL for file playback.
 * 
 * @param {string} storagePath Stored relative file path
 * @param {number} expiresIn Expiry time in seconds (default 300 seconds / 5 mins)
 * @returns {Promise<string>} Temporary HTTP signed access URL
 */
export const getAudioSignedUrl = async (storagePath, expiresIn = 300) => {
  if (!storagePath) return '';
  
  console.info(`[StorageService] Generating signed URL for: ${storagePath}`);
  
  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    console.error(`[StorageService] Signed URL generation failed for ${storagePath}:`, error);
    throw error;
  }

  return data.signedUrl;
};

/**
 * Removes a file from the Supabase storage bucket.
 * 
 * @param {string} storagePath Stored relative file path to delete
 */
export const deleteAudioFromStorage = async (storagePath) => {
  if (!storagePath) return;

  console.info(`[StorageService] Deleting file from bucket 'audio-recordings' path: ${storagePath}`);

  const { error } = await supabase.storage
    .from('audio-recordings')
    .remove([storagePath]);

  if (error) {
    console.error(`[StorageService] Deletion from bucket failed for ${storagePath}:`, error);
    // Log error but do not throw to prevent crashing deletion lifecycle
  }
};
