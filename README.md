# Voxora — Near Real-Time Speech-to-Text Workspace

Voxora is a modern speech-to-text web application focused on clean interaction design, browser-native audio processing, and elegant transcription workflows.

Built with React, Vite, Express.js, Deepgram, and Supabase, Voxora combines a polished frontend experience with functional audio recording, upload handling, AI-powered transcription, user authentication, and database/storage persistence.

---

# Project Vision

The goal of Voxora is to create a lightweight and visually refined transcription workspace that feels:
- calm
- responsive
- minimal
- modern
- technically reliable

Instead of building an overcomplicated AI dashboard, Voxora focuses on:
- clean UX
- browser audio systems
- elegant typography
- async interaction quality
- real transcription workflows

---

# Current Status

## Functional Features Completed
- Browser audio recording
- Audio waveform visualization
- Audio upload support
- Deepgram speech-to-Text integration
- Near real-time transcription workflow
- Backend upload infrastructure
- Supabase Authentication (login, signup, session persistence)
- Database persistence for transcription records
- Private bucket storage for recorded audio files
- User-isolated History dashboard (read, play, delete)
- Async state management (`saving` state)
- Error handling & orphaned storage file cleanup

---

# Day 1 — Frontend Foundation & Product Design

The first day focused entirely on frontend architecture, UI systems, and interaction design.

## Implemented
- Full React + Vite frontend setup
- Tailwind CSS v4 configuration
- Framer Motion animation system
- Modern brutalist-inspired UI direction
- Reusable design system
- Responsive layouts
- Upload workspace
- Recording interface
- Transcript simulation system
- Animated waveform prototype
- Component architecture
- Monorepo planning

## UI Features
- Large editorial typography
- Minimal workspace layout
- Drag-and-drop upload area
- Live waveform animations
- Recording controls
- Transcript display panel
- Theme support
- Mobile responsive layouts

---

# Day 2 — Browser Audio Systems & Backend Setup

Day 2 focused on transforming the frontend prototype into a functional application.

## Browser Audio Systems
Implemented:
- MediaRecorder API integration
- Microphone permission handling
- Browser audio recording
- Audio Blob generation
- Audio preview support
- Web Audio API integration
- Live waveform visualization using `AnalyserNode`

## Backend Infrastructure
Created:
- Express.js backend
- Multer upload pipeline
- Audio upload endpoints
- File validation system
- Upload size limits
- Backend route/controller structure

## Upload Flow
The following pipeline became functional:

```text
record audio
→ generate audio blob
→ upload to backend
→ store temporarily on server
```

---

# Day 3 — Real Speech-to-Text Integration

Day 3 focused on replacing simulated transcription with real AI-powered speech-to-text processing.

## Deepgram Integration
Integrated:
- `@deepgram/sdk` (v5 SDK)
- backend transcription service
- audio processing pipeline
- transcript response handling

## Functional Transcription Flow

The application now supports:

```text
record/upload audio
→ upload to Express backend
→ send audio to Deepgram
→ receive transcript
→ render transcript in UI
```

## Frontend Improvements
Implemented:
- real transcript rendering
- async loading states
- upload state transitions
- transcription progress indicators
- error handling states

## Async State System
The application now tracks:
- `idle`
- `recording`
- `paused`
- `uploading`
- `transcribing`
- `completed`
- `error`

## Resource Cleanup
Added:
- microphone track cleanup
- AudioContext cleanup
- object URL revocation
- temporary upload file cleanup

## Debugging & Stability
Implemented:
- structured console logging
- API error handling
- upload validation
- fail-fast environment validation

---

# Day 4 — Supabase Integration & Persistence

Day 4 focused on upgrading Voxora to a fully persistent, secure, multi-user web application with authentication, secure storage, database persistence, and user-isolated transcript history.

## User Authentication
Integrated:
- `@supabase/supabase-js` client-side library
- React Context (`AuthContext`) managing global user authentication sessions (sign-up, login, logout)
- Typography-focused `AuthModal` overlay adhering to Voxora's calm editorial style
- Header triggers rendering active user credentials and session controls

## Database Persistence
Created:
- `transcripts` table with RLS (Row Level Security) policies protecting user data isolation
- Server-side CRUD service (`transcriptService.js`) with optional JWT verification middleware (`authMiddleware.js`)
- Updated uploader route: authenticated users automatically save their transcripts, while guest transcription remains active as a fail-safe fallback

## Transcript History Feed
Created:
- `HistoryPanel` sidebar widget rendered below the upload zone in the left column
- Modal details overlay to read full past transcriptions
- Async state machine extension: added a `saving` state to display database write status during uploader transitions
- History GET and DELETE routes/controllers isolated by user authentication tokens

## Secure Audio Storage & On-Demand Playback
Created:
- Private `audio-recordings` bucket on Supabase Storage with folder-scoped user policies
- Server-side storage service (`storageService.js`) handling bucket uploads, signed url generation, and deletions
- **Exception Cleanup**: If the database transaction fails after an audio file is uploaded, the storage asset is automatically deleted from Supabase to prevent storage clutter
- **Exception Fallback**: Falls back to database-only save if the storage bucket is offline
- **On-Demand signed URLs**: Audio signed URLs are generated only when the user requests playback in the details modal, preserving security and file privacy

---

# Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Express.js |
| Database & Auth | Supabase DB & Auth |
| File Storage | Supabase Private Storage |
| Upload Handling | Multer |
| Audio Recording | MediaRecorder API |
| Audio Analysis | Web Audio API |
| Speech-to-Text | Deepgram SDK (v5) |

---

# Repository Structure

```bash
Voxora/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # NEW: AuthModal.jsx
│   │   │   ├── transcription/ # NEW: HistoryPanel.jsx
│   │   │   └── ...
│   │   ├── context/           # NEW: AuthContext.jsx
│   │   ├── lib/               # NEW: supabase.js
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/          # MODIFIED: api.js (JWT auth and history calls)
│   │   ├── animations/
│   │   ├── constants/         # MODIFIED: webm formats and 15MB file size limit
│   │   ├── data/
│   │   ├── utils/
│   │   └── index.css
│   └── package.json
│
├── server/
│   ├── controllers/           # NEW: historyController.js
│   ├── routes/                # NEW: historyRoutes.js
│   ├── middleware/            # NEW: authMiddleware.js (JWT verify)
│   ├── services/              # NEW: supabaseClient.js, transcriptService.js, storageService.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## Database & Storage Setup (Supabase SQL Editor)

Paste and run the following script in your Supabase SQL editor:

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

# Running The Project

## Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on:
```text
http://localhost:5173
```

---

## Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Backend runs on:
```text
http://localhost:5001
```

---

# Environment Variables

## Client `.env`

```env
VITE_API_URL=http://localhost:5001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Server `.env`

```env
PORT=5001
DEEPGRAM_API_KEY=your_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

---

# Current Engineering Focus

The current priority is:
- stability
- async coordination
- audio reliability
- transcript quality
- clean architecture

NOT:
- excessive frontend redesign
- unnecessary AI features
- overengineered realtime infrastructure

---

# Notes

- Uploaded audio files are excluded from Git tracking.
- Voxora currently uses request-based transcription instead of full websocket streaming.
- The project is intentionally scoped to remain deployable on free-tier infrastructure.
