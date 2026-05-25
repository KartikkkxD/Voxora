import { supabase } from './supabaseClient.js';

/**
 * Creates and persists a new transcript record.
 * 
 * @param {Object} params Object containing fields to insert
 * @returns {Promise<Object>} Inserted transcript record
 */
export const createTranscriptRecord = async ({
  userId,
  filename,
  transcript,
  audioUrl = null,
  duration = 0,
  sourceType = 'recording'
}) => {
  const { data, error } = await supabase
    .from('transcripts')
    .insert([
      {
        user_id: userId,
        filename,
        transcript,
        audio_url: audioUrl,
        duration,
        source_type: sourceType
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('[TranscriptService] Failed to insert transcript:', error);
    throw error;
  }

  return data;
};

/**
 * Fetches all transcripts associated with a given user ID.
 * 
 * @param {string} userId User UUID
 * @returns {Promise<Array>} List of transcripts ordered by creation date descending
 */
export const fetchUserTranscripts = async (userId) => {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[TranscriptService] Failed to fetch transcripts:', error);
    throw error;
  }

  return data;
};

/**
 * Deletes a transcript record from the database.
 * Enforces user isolation by querying on user_id as well.
 * 
 * @param {string} id Transcript UUID
 * @param {string} userId User UUID
 * @returns {Promise<Object>} The deleted transcript record metadata
 */
export const deleteUserTranscript = async (id, userId) => {
  const { data, error } = await supabase
    .from('transcripts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error(`[TranscriptService] Failed to delete transcript ${id}:`, error);
    throw error;
  }

  return data;
};

/**
 * Retrieves a single transcript record by ID, verifying user ownership.
 * 
 * @param {string} id Transcript UUID
 * @param {string} userId User UUID
 * @returns {Promise<Object>} Transcript record
 */
export const fetchUserTranscriptById = async (id, userId) => {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error(`[TranscriptService] Failed to fetch transcript ${id}:`, error);
    throw error;
  }

  return data;
};

