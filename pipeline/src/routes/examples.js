const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const IMAGES_DIR = path.join(process.env.SADTALKER_DIR, 'examples', 'source_image');

// Curated list — mix of illustrated and real faces
const FEATURED = [
  'art_0.png', 'art_3.png', 'art_5.png', 'art_9.png',
  'art_14.png', 'art_18.png', 'happy.png', 'happy1.png',
  'people_0.png', 'sad.png', 'full3.png', 'full4.jpeg',
];

// GET /api/examples/faces — list available example images
router.get('/faces', (req, res) => {
  const available = FEATURED.filter(f => fs.existsSync(path.join(IMAGES_DIR, f)));
  res.json(available.map(f => ({ name: f, url: `/api/examples/faces/${f}` })));
});

// GET /api/examples/faces/:filename — serve the image file
router.get('/faces/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(IMAGES_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(filePath);
});

module.exports = router;
