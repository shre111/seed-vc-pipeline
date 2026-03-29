# Seed-VC Voice Cloning & Avatar Video Pipeline

An AI-driven multimedia personalisation system that generates lip-synced, talking avatar videos with cloned voices.

## What it does

1. **Upload** a source audio (what to say), a reference voice sample (whose voice), and a face image
2. **Seed-VC** clones the voice from the reference sample and applies it to the source audio
3. **SadTalker** animates the face image, driven by the cloned audio
4. **FFmpeg** normalises the final video
5. **Download** the resulting MP4

## Stack

- **AI Models:** Seed-VC (voice cloning) · SadTalker (avatar animation)
- **Backend:** Node.js · Express · FFmpeg
- **Frontend:** React · Vite

## Project Structure

```
├── pipeline/     ← Node.js orchestration API (Express)
│   ├── src/
│   │   ├── index.js
│   │   ├── routes/pipeline.js    ← Job submission, status, download
│   │   ├── routes/examples.js    ← Example face images
│   │   ├── services/seedvc.js    ← Seed-VC voice cloning
│   │   ├── services/sadtalker.js ← SadTalker avatar animation
│   │   ├── services/ffmpeg.js    ← Video post-processing
│   │   └── utils/jobStore.js     ← In-memory job tracking
└── frontend/     ← React UI (Vite)
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── FileInput.jsx       ← File upload input
        │   ├── ExampleFaces.jsx    ← Example face image picker
        │   ├── StatusPanel.jsx     ← Live job progress
        │   └── VideoResult.jsx     ← Video player + download
        └── hooks/usePipeline.js    ← API + polling logic
```

## Setup

### Prerequisites

- Python 3.10 (via Miniconda)
- Node.js 18+
- NVIDIA GPU with CUDA 12.6+ (RTX 4060 or better)
- FFmpeg

### AI Models

Clone and set up separately (not included in this repo):

```bash
# Voice cloning
git clone https://github.com/Plachtaa/seed-vc ../seed-vc

# Avatar animation
git clone https://github.com/OpenTalker/SadTalker ../sadtalker
```

### Backend

```bash
cd pipeline
cp .env.example .env   # edit paths to match your system
npm install
node src/index.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/pipeline/start` | Submit job (`source_audio`, `target_audio`, `face_image`) |
| `GET` | `/api/pipeline/status/:id` | Poll job status |
| `GET` | `/api/pipeline/download/:id` | Download final MP4 |
| `GET` | `/api/examples/faces` | List example face images |
