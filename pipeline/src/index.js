require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const REQUIRED_ENV = [
  'SEEDVC_PYTHON', 'SADTALKER_PYTHON',
  'SEEDVC_DIR',    'SADTALKER_DIR',
  'FFMPEG_BIN',    'UPLOADS_DIR', 'OUTPUTS_DIR',
];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[startup] Missing required env vars: ${missing.join(', ')}`);
  console.error('[startup] Check your pipeline/.env file. Server will not start.');
  process.exit(1);
}

const pipelineRouter = require('./routes/pipeline');
const examplesRouter = require('./routes/examples');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure output/upload dirs exist on startup
[process.env.UPLOADS_DIR, process.env.OUTPUTS_DIR].forEach((dir) => {
  if (dir) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Pipeline API
app.use('/api/pipeline', pipelineRouter);

// Examples (face images)
app.use('/api/examples', examplesRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Pipeline server running on http://localhost:${PORT}`);
  console.log(`  POST /api/pipeline/start        — submit a job`);
  console.log(`  GET  /api/pipeline/status/:id   — poll job status`);
  console.log(`  GET  /api/pipeline/download/:id — download result`);
});
