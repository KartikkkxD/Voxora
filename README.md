# Voxora — Near Real-Time Speech-to-Text Workspace

Voxora is a modern speech-to-text web application focused on clean interaction design, browser-native audio processing, and elegant transcription workflows.

Built with React, Vite, Express.js, and Deepgram, Voxora combines a polished frontend experience with functional audio recording, upload handling, and AI-powered transcription.

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
- Deepgram speech-to-text integration
- Near real-time transcription workflow
- Backend upload infrastructure
- Async state management
- Error handling
- Resource cleanup systems

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
- `@deepgram/sdk`
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

```text
idle
recording
paused
uploading
transcribing
completed
error
```

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

# Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Backend | Express.js |
| Upload Handling | Multer |
| Audio Recording | MediaRecorder API |
| Audio Analysis | Web Audio API |
| Speech-to-Text | Deepgram SDK |

---

# Repository Structure

```bash
Voxora/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── animations/
│   │   ├── constants/
│   │   ├── data/
│   │   ├── utils/
│   │   └── index.css
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── README.md
└── .gitignore
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
http://localhost:3001
```

---

# Environment Variables

## Server `.env`

```env
PORT=3001
DEEPGRAM_API_KEY=your_api_key_here
```

---

# What’s Next (Upcoming Development)

The next development phase focuses on improving perceived realtime interaction and product stability.

## Planned Next Steps

### Chunk-Based Progressive Transcription
Move from:
```text
record → upload → transcribe
```

toward:
```text
continuous audio chunks
→ progressive uploads
→ incremental transcript updates
```

This will create a near real-time transcription experience without introducing full websocket complexity.

---

## Future Improvements
Planned:
- progressive chunk transcription
- transcript persistence
- transcript history
- improved error UX
- deployment
- transcript export
- optional AI summaries

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

---

# Status Summary

Voxora has successfully evolved from:
> a frontend prototype

into:
> a functional browser-based speech-to-text application with real transcription capabilities.
