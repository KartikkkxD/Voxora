import { fetchUserTranscripts, deleteUserTranscript, fetchUserTranscriptById } from '../services/transcriptService.js';
import { getAudioSignedUrl, deleteAudioFromStorage } from '../services/storageService.js';

/**
 * Retrieves the history of transcripts for the authenticated user.
 */
export const getHistory = async (req, res, next) => {
  try {
    console.info(`[HistoryController] Fetching history for user ${req.user.id}`);
    const transcripts = await fetchUserTranscripts(req.user.id);
    
    // We do NOT generate signed URLs here to avoid performance overhead and expiry issues.
    // Signed URLs are generated on-demand when playback is requested.
    res.status(200).json({
      success: true,
      transcripts
    });
  } catch (err) {
    console.error('[HistoryController] Failed to fetch transcripts history:', err);
    next(err);
  }
};

/**
 * Generates a temporary signed URL for transcript audio playback.
 * Restricts access to owners only.
 */
export const getTranscriptAudio = async (req, res, next) => {
  const { id } = req.params;
  try {
    console.info(`[HistoryController] Requesting audio signed URL for transcript ${id} (user ${req.user.id})`);
    const transcript = await fetchUserTranscriptById(id, req.user.id);

    if (!transcript || !transcript.audio_url) {
      return res.status(404).json({
        success: false,
        error: {
          status: 404,
          message: 'Audio asset not found for this transcript.'
        }
      });
    }

    const signedUrl = await getAudioSignedUrl(transcript.audio_url);
    
    res.status(200).json({
      success: true,
      signedUrl
    });
  } catch (err) {
    console.error(`[HistoryController] Failed to generate signed URL for transcript ${id}:`, err);
    next(err);
  }
};

/**
 * Deletes a transcript record and its associated audio file in storage.
 * User isolation is handled by the service layer.
 */
export const removeTranscript = async (req, res, next) => {
  const { id } = req.params;
  try {
    console.info(`[HistoryController] Deleting transcript ${id} for user ${req.user.id}`);
    const transcript = await deleteUserTranscript(id, req.user.id);
    
    // Cleanup storage file associated with this transcript
    if (transcript && transcript.audio_url) {
      await deleteAudioFromStorage(transcript.audio_url);
    }
    
    res.status(200).json({
      success: true,
      message: 'Transcript record and audio asset deleted successfully.',
      transcript
    });
  } catch (err) {
    console.error(`[HistoryController] Failed to delete transcript ${id}:`, err);
    next(err);
  }
};
