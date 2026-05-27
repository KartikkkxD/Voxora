import { transcribeAudio, transcribeAudioBuffer } from '../services/transcriptionService.js';
import { createTranscriptRecord } from '../services/transcriptService.js';
import { uploadAudioToStorage, deleteAudioFromStorage } from '../services/storageService.js';
import fs from 'fs';

/**
 * Controller to handle POST /api/transcribe requests.
 * Passes the uploaded audio file to the Deepgram service, unlinks the temporary file 
 * in a finally block, and returns the transcription payload.
 * Optionally persists the transcript in the database and uploads the file to storage if user is authenticated.
 */
export const handleTranscription = async (req, res, next) => {
  const filePath = req.file?.path;

  try {
    console.log(req.file);
    console.log(req.file?.mimetype);
    console.log(req.file?.size);
    console.log(req.file?.path);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: 'No valid audio file attached. Allowed formats are: MP3, WAV, M4A, WEBM (Max 15MB).'
        }
      });
    }

    console.log(fs.existsSync(req.file.path));
    console.info(`[TranscriptionController] Local buffer cached. Triggering Speech-to-Text...`);

    // Call transcription service
    const transcriptionResult = await transcribeAudio(filePath, req.file.mimetype);
    console.log(JSON.stringify(transcriptionResult, null, 2));

    // Phase 2 & 4: Save transcript & audio to DB/Storage if user is authenticated
    let savedRecord = null;
    if (req.user) {
      let storagePath = '';
      try {
        console.info(`[TranscriptionController] Authenticated user [${req.user.id}]. Uploading audio to storage...`);
        
        // 1. Storage Upload
        try {
          storagePath = await uploadAudioToStorage(
            filePath,
            req.user.id,
            req.file.originalname,
            req.file.mimetype
          );
          console.info(`[TranscriptionController] Audio uploaded successfully: ${storagePath}`);
        } catch (storageErr) {
          console.error('[TranscriptionController] Non-blocking Storage upload failure, falling back to database save without audio:', storageErr);
          storagePath = ''; // Fallback: save without audio
        }

        // 2. Database Insert
        try {
          savedRecord = await createTranscriptRecord({
            userId: req.user.id,
            filename: req.file.originalname,
            transcript: transcriptionResult.transcript,
            audioUrl: storagePath, // Stored as relative path (e.g. userId/file.webm)
            duration: parseInt(req.body.duration || 0, 10),
            sourceType: req.body.sourceType || 'recording'
          });
          console.info(`[TranscriptionController] Transcript successfully persisted to Supabase DB: ID ${savedRecord.id}`);
        } catch (dbErr) {
          console.error('[TranscriptionController] Database save failed:', dbErr);
          
          // 3. Orphaned File Cleanup
          if (storagePath) {
            console.warn(`[TranscriptionController] Cleaning up orphaned storage file: ${storagePath}`);
            await deleteAudioFromStorage(storagePath);
          }
        }
      } catch (authErr) {
        console.error('[TranscriptionController] Persistence flow exception:', authErr);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Audio transcription completed successfully.',
      transcript: transcriptionResult.transcript,
      confidence: transcriptionResult.confidence,
      metadata: transcriptionResult.metadata,
      id: savedRecord?.id || null
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

/**
 * Controller to handle POST /api/transcribe/chunk.
 * Receives in-memory chunk buffer, transcribes it through Deepgram client, 
 * and echoes back the chunkIndex to maintain client-side sequencing.
 */
export const handleChunkTranscription = async (req, res, next) => {
  try {
    console.log(req.file);
    console.log(req.file?.mimetype);
    console.log(req.file?.size);

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: {
          status: 400,
          message: 'No valid audio chunk buffer found.'
        }
      });
    }

    const chunkIndex = parseInt(req.body.chunkIndex || 0, 10);
    console.info(`[TranscriptionController] Processing chunk [index=${chunkIndex}, size=${req.file.size} bytes]`);

    // Transcribe in-memory buffer directly
    const result = await transcribeAudioBuffer(req.file.buffer, req.file.mimetype);
    console.log(JSON.stringify(result, null, 2));

    res.status(200).json({
      success: true,
      transcript: result.transcript,
      confidence: result.confidence,
      chunkIndex
    });

  } catch (err) {
    console.error('[TranscriptionController] Exception during chunk transcription:', err);
    next(err);
  }
};

