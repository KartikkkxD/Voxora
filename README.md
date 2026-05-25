# Voxora — Speech-to-Text Workspace

Voxora is a modern real-time speech-to-text web application featuring a minimal, clean, and editorial design inspired by Apple, Notion, and Raycast.

This version connects browser-based audio recording and file uploads to a local Express backend integrated with the **Deepgram Speech-to-Text API** for high-fidelity, real-world transcription.

---

## Technical Features

### Frontend (client)
* **Browser Audio Capturing**: Uses the native **MediaRecorder API** to record live microphone input, saving binary chunks into a WebM blob.
* **Microphone-Reactive Waveform**: Connects to the **Web Audio API** (`AnalyserNode`) to sample mic frequencies, downsampling them into **24 animated waveform bars** with a calming bell-curve factor.
* **Playback Preview**: Hosts an audio preview player once recording is complete.
* **Workspace State Machine**: Transition logic governing the UI: `idle` → `recording` → `paused` → `uploading` → `transcribing` → `completed` → `error`.
* **Progressive Typography Typing**: Receives the raw text returned by the backend, splits it into sentence structures, and types them out word-by-word with punctuation pauses to retain the polished typography animations.

### Backend (server)
* **Express.js API Boot**: Validates environment variables (`PORT` and `DEEPGRAM_API_KEY`) and fails fast at boot time if missing.
* **Multer Audio Pipeline**: Handles incoming `multipart/form-data` uploads up to **15MB** in MP3, WAV, M4A, and WEBM formats.
* **Deepgram SDK Integration**: Houses service layers connecting to the Deepgram Speech-to-Text API (v5 SDK) using the `nova-2` model and `smart_format` rules.
* **Resource Garbage Collection**: Automatically deletes (`fs.unlinkSync`) temporary audio uploads from the server disk inside a `finally` block once transcription finishes.

---

## Repository Structure

```
Voxora/
├── client/     # React + Vite frontend application
└── server/     # Express.js backend application
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- A Deepgram API key (Free Tier)

### 1. Backend Setup (server)
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file and insert your Deepgram credentials:
   ```env
   PORT=5001
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```
5. Start the backend server:
   ```bash
   npm start
   ```

### 2. Frontend Setup (client)
1. Navigate to the client folder (in a new terminal):
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Verify the backend target URL:
   ```env
   VITE_API_URL=http://localhost:5001
   ```
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
