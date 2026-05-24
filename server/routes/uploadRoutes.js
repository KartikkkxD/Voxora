import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { handleUpload } from '../controllers/uploadController.js';

const router = express.Router();

const uploadDir = './uploads';

// Ensure the temporary uploads directory exists on server boot
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Ext name extraction (fallback to .webm if MediaRecorder uploads raw blob)
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `audio-${uniqueSuffix}${ext}`);
  }
});

// Audio mime-type and extension validation filters
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
    'video/webm', // Chrome MediaRecorder records audio under video/webm wrapper
    'application/octet-stream' // fallback for raw binary chunks
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = allowedExtensions.includes(ext) || ext === '';
  const isMimeAllowed = allowedMimeTypes.includes(mime);

  if (isExtAllowed || isMimeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Invalid audio format. Allowed extensions are: MP3, WAV, M4A, WEBM.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB file size boundary
  }
});

// Attach single file upload pipeline
router.post('/upload', upload.single('audio'), handleUpload);

export default router;
