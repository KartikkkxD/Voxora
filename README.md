# Voxora — Speech-to-Text Workspace (Supabase Persistence Edition)

Voxora is a modern real-time speech-to-text web application featuring a minimal, clean, and editorial design inspired by Apple, Notion, and Raycast.

This version connects browser-based audio recording and file uploads to a local Express backend integrated with the **Deepgram Speech-to-Text API** for transcription, and **Supabase** for database persistence, private audio storage, user authentication, and strict user data isolation.

---

## Technical Features

### Frontend (client)
* **User Authentication**: Simple email/password sign-up, login, and logout state management through React Context (`AuthContext`) powered by Supabase Auth.
* **Persistent History Dashboard**: Editorial history sidebar listing past transcripts (dates, formats, text snippets) for logged-in users.
* **On-Demand Secure Playback**: Audio playback resolves temporary signed links from private buckets on user request (reducing hotlinking and token expiration issues).
* **Browser Audio Capturing**: Uses the native **MediaRecorder API** to record microphone input.
* **Microphone-Reactive Waveform**: Connects to the **Web Audio API** (`AnalyserNode`) to sample mic frequencies, downsampling them into **24 animated waveform bars**.
* **Workspace State Machine**: Governs the UI states: `idle` → `recording` → `paused` → `uploading` → `transcribing` → `saving` → `completed` → `error`.

### Backend (server)
* **JWT Token Authentication Middleware**: Validates user identity securely via Supabase JWT headers on history and transcription endpoints. Supports optional auth for guest users.
* **Supabase DB & Storage Integration**: Saves transcription metadata directly to database, uploads audio streams to private `audio-recordings` storage buckets, and returns access keys.
* **Multer Upload Boundary**: Gracefully parses multipart uploads up to **15MB** in MP3, WAV, M4A, and WEBM formats.
* **Garbage Collection & Orphan Cleanup**:
  - Automatically unlinks temporary server files.
  - Automatically deletes uploaded storage assets from Supabase if the database transaction fails.
  - Falls back to database-only save if storage is temporarily offline.

---

## Repository Structure

```
Voxora/
├── client/     # React + Vite frontend application
└── server/     # Express.js backend application
```

---

## Database & Storage Setup (Supabase)

Run this script in your Supabase SQL Editor to prepare your database and bucket policies:

```sql
-- Create transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  transcript TEXT NOT NULL,
  audio_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL CHECK (source_type IN ('recording', 'upload')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- Transcripts RLS Policies
CREATE POLICY "Users can view their own transcripts" ON public.transcripts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transcripts" ON public.transcripts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transcripts" ON public.transcripts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket configuration (Create a private bucket named 'audio-recordings' first)
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Allow authenticated users to read files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'audio-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- A Deepgram API key
- A Supabase Project (Database & Storage)

### 1. Backend Setup (server)
1. Navigate to `server` folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Configure `.env`:
   ```env
   PORT=5001
   DEEPGRAM_API_KEY=your_deepgram_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
5. Start server:
   ```bash
   npm start
   ```

### 2. Frontend Setup (client)
1. Navigate to `client` folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```
4. Configure `.env`:
   ```env
   VITE_API_URL=http://localhost:5001
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
5. Start client:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
