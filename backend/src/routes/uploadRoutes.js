const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Ensure uploads directory exists in both backend/uploads and root uploads
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.use(authenticateToken);

/**
 * POST /api/upload
 * Accepts base64 encoded image or data URL, saves to disk, returns public static URL
 */
router.post('/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required' });
    }

    let base64Data = image;
    let ext = 'jpg';

    // Handle Data URL format: data:image/png;base64,....
    if (image.startsWith('data:image/')) {
      const mimeMatch = image.match(/^data:image\/([a-zA-Z0-9-+.]+);base64,/);
      if (mimeMatch) {
        ext = mimeMatch[1] === 'jpeg' ? 'jpg' : mimeMatch[1];
        if (ext === 'svg+xml') ext = 'svg';
      }
      base64Data = image.replace(/^data:image\/[a-zA-Z0-9-+.]+;base64,/, '');
    }

    const filename = `img-${Date.now()}-${Math.floor(Math.random() * 1000000)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;
    console.log(`📸 Image saved to disk: ${filePath} -> ${imageUrl}`);

    res.json({
      success: true,
      imageUrl,
      filename
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to save uploaded image: ' + err.message });
  }
});

module.exports = router;
