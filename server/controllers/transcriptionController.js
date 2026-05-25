import { transcribeAudio } from '../services/transcriptionService.js';
import fs from 'fs';

/**
 * Controller to handle POST /api/transcribe requests.
 * Passes the uploaded audio file to the Deepgram service, unlinks the temporary file 
 * in a finally block, and returns the transcription payload.
 */
export const handleTranscription = async (req, res, next) => {
  const filePath = req.file?.path;

  try {
    console.info(`[UPLOAD_RECEIVED] [${new Date().toISOString()}] File metadata: name="${req.file?.originalname}", size=${req.file?.size} bytes`);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: 'No valid audio file attached. Allowed formats are: MP3, WAV, M4A, WEBM (Max 15MB).'
        }
      });
    }

    console.info(`[TranscriptionController] Local buffer cached. Triggering Speech-to-Text...`);

    // Call transcription service
    const transcriptionResult = await transcribeAudio(filePath, req.file.mimetype);

    res.status(200).json({
      success: true,
      message: 'Audio transcription completed successfully.',
      transcript: transcriptionResult.transcript,
      confidence: transcriptionResult.confidence,
      metadata: transcriptionResult.metadata
    });

  } catch (err) {
    console.error('[TranscriptionController] Exception caught during transcription processing:', err);
    next(err);
  } finally {
    // Phase 8 Resource Cleanup: Always remove temporary files from server disk after processing
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.info(`[TranscriptionController] Temporary upload unlinked successfully: ${filePath}`);
      } catch (cleanupErr) {
        console.error(`[TranscriptionController] Failed to unlink temporary file: ${filePath}`, cleanupErr);
      }
    }
  }
};
