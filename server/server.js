import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRoutes from './routes/uploadRoutes.js';
import transcriptionRoutes from './routes/transcriptionRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment configurations
dotenv.config();

// Fail-fast environmental validation check
console.info('[Server] Validating environment configurations...');
const PORT = process.env.PORT || 5001;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DEEPGRAM_API_KEY) {
  console.error('[Server] CRITICAL STARTUP ERROR: DEEPGRAM_API_KEY is undefined in environment.');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[Server] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Auth and persistence features will fail, but guest transcription remains active.');
} else {
  console.info('[Server] Supabase environment variables detected.');
}

console.info('[Server] Environmental checks passed.');

const app = express();

// Standard middleware setup
app.use(cors({
  origin: '*', // Allow client connections
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug request logging logger middleware
app.use((req, res, next) => {
  console.info(`[Server] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Base Route mapping
app.use('/api', uploadRoutes);
app.use('/api', transcriptionRoutes);
app.use('/api', historyRoutes);

// Quick service status diagnostic route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(process.uptime())}s`
  });
});

// Centralized global error mapping boundary
app.use(errorHandler);

app.listen(PORT, () => {
  console.info(`[Server] Voxora API Server listening on port ${PORT}`);
});
