import { DeepgramClient } from '@deepgram/sdk';
import fs from 'fs';
import { Readable } from 'stream';

/**
 * Sends a local audio file stream to the Deepgram API (v5 SDK) for Speech-to-Text.
 * 
 * @param {string} filePath Local system path to the audio file
 * @param {string} mimetype Mime type of the uploaded file
 * @returns {Promise<Object>} Clean transcript text and metadata parameters
 */
export const transcribeAudio = async (filePath, mimetype) => {
  console.info(`[TRANSCRIPTION_STARTED] [${new Date().toISOString()}] Processing file: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`[TranscriptionService] Target file does not exist: ${filePath}`);
    throw new Error(`Target file not found: ${filePath}`);
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey || apiKey === 'dummy_testing_key') {
    throw new Error('Deepgram API Key is missing or unconfigured. Please configure DEEPGRAM_API_KEY in server/.env');
  }

  try {
    // Instantiate DeepgramClient according to v5 SDK specifications
    const deepgram = new DeepgramClient(apiKey);
    const audioStream = fs.createReadStream(filePath);

    console.info('[TranscriptionService] Dispatching file stream to Deepgram v5 listen.v1.media endpoint...');

    const response = await deepgram.listen.v1.media.transcribeFile(
      audioStream,
      {
        model: 'nova-2',
        smart_format: true,
      }
    );

    const transcriptText = response?.results?.channels[0]?.alternatives[0]?.transcript;

    if (transcriptText === undefined || transcriptText === null) {
      console.warn('[TranscriptionService] Deepgram response did not return a valid transcript.');
      throw new Error('Malformed or empty response payload from Deepgram.');
    }

    console.info(`[TRANSCRIPTION_COMPLETED] [${new Date().toISOString()}] Character count: ${transcriptText.length}`);
    
    return {
      transcript: transcriptText,
      confidence: response?.results?.channels[0]?.alternatives[0]?.confidence || 1.0,
      metadata: response?.metadata || {}
    };

  } catch (err) {
    console.error(`[TRANSCRIPTION_FAILED] [${new Date().toISOString()}] Error during transcription:`, err);
    throw err;
  }
};

/**
 * Transcribes an in-memory audio Buffer using Deepgram (v5 Node SDK) directly.
 * Bypasses filesystem storage entirely for rapid progressive chunking.
 * 
 * @param {Buffer} buffer Audio buffer payload
 * @param {string} mimetype Mime type of the buffer
 * @returns {Promise<Object>} Transcript result
 */
export const transcribeAudioBuffer = async (buffer, mimetype) => {
  console.info(`[CHUNK_TRANSCRIPTION_STARTED] [${new Date().toISOString()}] Buffer size: ${buffer.length} bytes`);

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey || apiKey === 'dummy_testing_key') {
    throw new Error('Deepgram API Key is missing or unconfigured.');
  }

  try {
    const deepgram = new DeepgramClient(apiKey);
    // Wrap the buffer in a stream for Deepgram API compatibility
    const audioStream = Readable.from(buffer);

    const response = await deepgram.listen.v1.media.transcribeFile(
      audioStream,
      {
        model: 'nova-2',
        smart_format: true,
      }
    );

    const transcriptText = response?.results?.channels[0]?.alternatives[0]?.transcript || '';

    return {
      transcript: transcriptText,
      confidence: response?.results?.channels[0]?.alternatives[0]?.confidence || 1.0,
    };

  } catch (err) {
    console.error('[TranscriptionService] Error transcribing audio buffer:', err);
    throw err;
  }
};
