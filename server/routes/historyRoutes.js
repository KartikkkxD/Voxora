import express from 'express';
import { getHistory, removeTranscript, getTranscriptAudio } from '../controllers/historyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/transcripts', requireAuth, getHistory);
router.get('/transcripts/:id/audio', requireAuth, getTranscriptAudio);
router.delete('/transcripts/:id', requireAuth, removeTranscript);

export default router;
