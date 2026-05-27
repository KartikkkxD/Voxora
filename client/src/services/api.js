import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

console.info(`[API Client] Initialized API Service base target: ${API_BASE_URL}`);

/**
 * Retrieves the authorization headers using the active Supabase session.
 * 
 * @returns {Promise<Object>} Headers object containing Bearer token if session exists
 */
const getAuthHeaders = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        'Authorization': `Bearer ${session.access_token}`
      };
    }
  } catch (err) {
    console.warn('[API Client] Could not read active session:', err);
  }
  return {};
};

/**
 * Dispatches audio File/Blob binary payloads to the Express backend upload endpoint.
 * 
 * @param {Blob|File} audioSource Audio blob from recorder or file from upload zone
 * @param {string} defaultName Default name assigned
 * @returns {Promise<Object>} Server JSON result
 */
export const uploadAudioFile = async (audioSource, defaultName = 'audio-source.webm') => {
  try {
    console.info(`[API Client] Starting audio upload stream. Payload Size: ${audioSource.size} bytes`);
    
    const formData = new FormData();
    const audioFile = audioSource instanceof File
      ? audioSource
      : new File([audioSource], defaultName, { type: audioSource.type || 'audio/webm' });

    formData.append('audio', audioFile);

    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Upload failed with status: ${response.status}`);
    }

    console.info('[API Client] Audio upload success:', data);
    return data;

  } catch (err) {
    console.error('[API Client] Request failed during upload lifecycle:', err);
    throw err;
  }
};

/**
 * Dispatches audio File/Blob payloads to the Express backend transcription endpoint.
 * 
 * @param {Blob|File} audioSource Audio blob from recorder or file from upload zone
 * @param {string} defaultName Default name assigned
 * @param {number} duration Duration of the recording in seconds
 * @param {string} sourceType 'recording' | 'upload'
 * @returns {Promise<Object>} Response containing transcript string
 */
export const transcribeAudioFile = async (
  audioSource,
  defaultName = 'audio-source.webm',
  duration = 0,
  sourceType = 'recording'
) => {
  try {
    console.info(`[API Client] Starting audio transcription request. Payload Size: ${audioSource.size} bytes`);
    
    const formData = new FormData();
    const audioFile = audioSource instanceof File
      ? audioSource
      : new File([audioSource], defaultName, { type: audioSource.type || 'audio/webm' });

    formData.append('audio', audioFile);
    formData.append('duration', Math.round(duration));
    formData.append('sourceType', sourceType);

    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: {
        ...authHeaders
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Transcription failed with status: ${response.status}`);
    }

    console.info('[API Client] Audio transcription success:', data);
    return data;

  } catch (err) {
    console.error('[API Client] Request failed during transcription lifecycle:', err);
    throw err;
  }
};

/**
 * Fetches user-isolated transcript history from the database.
 * 
 * @returns {Promise<Array>} List of user transcripts
 */
export const fetchTranscriptsHistory = async () => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/transcripts`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Fetching transcripts failed with status: ${response.status}`);
    }

    return data.transcripts || [];

  } catch (err) {
    console.error('[API Client] Request failed during history fetch:', err);
    throw err;
  }
};

/**
 * Deletes a transcript from database and storage.
 * 
 * @param {string} transcriptId UUID of the transcript to delete
 * @returns {Promise<Object>} Success status response
 */
export const deleteTranscriptFromServer = async (transcriptId) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/transcripts/${transcriptId}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Deletion failed with status: ${response.status}`);
    }

    return data;

  } catch (err) {
    console.error('[API Client] Request failed during transcript delete:', err);
    throw err;
  }
};

/**
 * Fetches a short-lived signed URL for audio playback of a private transcript recording.
 * 
 * @param {string} transcriptId UUID of the transcript
 * @returns {Promise<string>} Signed playback URL
 */
export const fetchTranscriptAudio = async (transcriptId) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/transcripts/${transcriptId}/audio`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Fetching audio signed URL failed: ${response.status}`);
    }

    return data.signedUrl;

  } catch (err) {
    console.error('[API Client] Failed to fetch transcript audio signed URL:', err);
    throw err;
  }
};

/**
 * Sends a single audio slice (chunk) in-memory to the Express chunk transcription endpoint.
 * 
 * @param {Blob|File} chunkSource Audio chunk blob
 * @param {number} chunkIndex Sequential order index of the chunk
 * @param {string} defaultName Default name assigned
 * @returns {Promise<Object>} Response containing transcript string and chunkIndex
 */
export const transcribeAudioChunk = async (
  chunkSource,
  chunkIndex = 0,
  defaultName = 'chunk.webm'
) => {
  try {
    const formData = new FormData();
    const audioFile = chunkSource instanceof File
      ? chunkSource
      : new File([chunkSource], defaultName, { type: chunkSource.type || 'audio/webm' });

    formData.append('audio', audioFile);
    formData.append('chunkIndex', chunkIndex);

    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/transcribe/chunk`, {
      method: 'POST',
      headers: {
        ...authHeaders
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Chunk transcription failed with status: ${response.status}`);
    }

    return data;

  } catch (err) {
    console.error(`[API Client] Failed to transcribe chunk [index=${chunkIndex}]:`, err);
    throw err;
  }
};

