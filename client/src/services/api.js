const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

console.info(`[API Client] Initialized API Service base target: ${API_BASE_URL}`);

/**
 * Dispatches audio File/Blob binary payloads to the Express backend.
 * Converts blobs into named File objects so multer filters can resolve extension formats.
 * 
 * @param {Blob|File} audioSource Audio blob from recorder or file from upload zone
 * @param {string} defaultName Default name assigned (helps mime resolver)
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

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
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
 * @param {string} defaultName Default name assigned (helps mime resolver)
 * @returns {Promise<Object>} Response containing transcript string
 */
export const transcribeAudioFile = async (audioSource, defaultName = 'audio-source.webm') => {
  try {
    console.info(`[API Client] Starting audio transcription request. Payload Size: ${audioSource.size} bytes`);
    
    const formData = new FormData();
    const audioFile = audioSource instanceof File
      ? audioSource
      : new File([audioSource], defaultName, { type: audioSource.type || 'audio/webm' });

    formData.append('audio', audioFile);

    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
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
