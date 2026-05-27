import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { handleTranscription, handleChunkTranscription } from '../controllers/transcriptionController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const uploadDir = './uploads';

// Ensure the temporary uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage setup for the transcription pipeline
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `transcribe-${uniqueSuffix}${ext}`);
  }
});

// Allowed audio types filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.mp3', '.wav', '.m4a', '.webm'];
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4',
    'audio/webm',
    'video/webm',
    'application/octet-stream'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = allowedExtensions.includes(ext) || ext === '';
  const isMimeAllowed = allowedMimeTypes.includes(mime);

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Invalid audio format. Supported formats are: MP3, WAV, M4A, WEBM.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB size limit
  }
});

// In-memory multer storage for lightweight chunk transcription (bypasses disk writes)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for chunks (usually ~50KB per chunk)
  }
});

router.post('/transcribe', optionalAuth, upload.single('audio'), handleTranscription);
router.post('/transcribe/chunk', optionalAuth, memoryUpload.single('audio'), handleChunkTranscription);

export default router;

