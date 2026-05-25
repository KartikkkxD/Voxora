export const APP_NAME = 'Voxora';

export const SUPPORTED_FILE_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/ogg'
];

export const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.webm'];

export const MAX_FILE_SIZE_BYTES = 15728640; // 15 MB

export const HERO_CONTENT = {
  headline: 'Speak naturally. Read instantly.',
  subheading: 'Real-time speech to text, beautifully designed. A quiet, distraction-free space for your spoken words, transcribed with high fidelity.',
  cta: 'Record live audio'
};

export const TRANSCRIPTION_LIMITS = {
  maxRecordingTimeSeconds: 300, // 5 minutes mock limit
};
