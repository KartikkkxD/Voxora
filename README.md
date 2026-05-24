# Voxora — Real-Time Speech-to-Text Platform

A modern, brutalist-styled real-time AI transcription workspace built with React, Vite, and Express.

---

## Development Progress

### Day 1 — Frontend Architecture & UI System

Built the complete frontend prototype from scratch with a modern brutalist design language:

- **Landing Page** — massive typography hero, animated feature grid, auto-cycling transcript demo, dark CTA section, editorial footer
- **Dashboard** — stats overview, quick action cards, waveform visualizer, AI summary placeholder, recent transcripts list
- **Recording UI** — giant microphone button with pulse rings, live waveform animation, word-by-word typing simulation
- **Upload Experience** — drag-and-drop zone with progress animation and file validation (MP3, WAV, M4A)
- **Transcript Library** — searchable list with status badges and metadata
- **Design System** — cobalt blue accent, Space Grotesk + Inter + JetBrains Mono typography, 3px brutalist borders, reusable card/button/label components
- **Responsive** — full mobile, tablet, and desktop layouts with sidebar drawer

### Day 2 — Frontend-Backend Integration & Audio Recording

Connected the frontend to a real backend and implemented functional audio recording:

- **MediaRecorder API** — integrated browser-native audio capture with the `useAudioRecorder` hook using `MediaRecorder` and Web Audio API
- **Real-Time Waveform** — connected `AnalyserNode` to visualize live audio input during recording sessions
- **Express Upload Server** — built an Express.js backend with Multer middleware to receive and store audio file uploads
- **Audio File Storage** — recorded audio files are saved server-side in `server/uploads/` with unique filenames
- **Recording Flow** — full start → recording → stop → upload pipeline working end-to-end in the browser
- **Dark Theme** — added theme toggle with persistent dark mode support

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide React, React Router DOM |
| **Backend** | Express.js, Multer (file uploads), CORS |
| **Audio** | MediaRecorder API, Web Audio API (AnalyserNode) |

---

## Repository Structure

```
Voxora/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom hooks (audio recorder, theme, transcription)
│   │   ├── layouts/         # Page layout wrappers
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API service layer
│   │   ├── data/            # Mock transcript data
│   │   ├── animations/      # Framer Motion variants
│   │   ├── constants/       # App constants
│   │   ├── utils/           # Formatters and helpers
│   │   └── index.css        # Design system (Tailwind v4 + CSS tokens)
│   └── package.json
│
├── server/                  # Express.js backend
│   ├── controllers/         # Route handlers
│   ├── middleware/           # Error handling
│   ├── routes/              # API routes
│   ├── services/            # Transcription service (placeholder)
│   ├── uploads/             # Stored audio files (gitignored)
│   └── package.json
│
├── .gitignore               # Excludes node_modules, .env, uploads, audio files
└── README.md
```

---

## Running Locally

### 1. Frontend

```bash
cd client
npm install
npm run dev
```

Opens at `http://localhost:5173`

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
npm start
```

Runs at `http://localhost:3001`

---

## What's Next (Day 3+)

- [ ] Real-time WebSocket streaming for live transcription
- [ ] Speech-to-text API integration (Whisper / Deepgram)
- [ ] Transcript persistence and database storage
- [ ] Speaker diarization
- [ ] AI-powered meeting summaries
- [ ] Authentication and user accounts

---

> **Note:** Audio files recorded during testing are excluded from version control via `.gitignore`. The `server/uploads/` directory stores recordings locally only.
