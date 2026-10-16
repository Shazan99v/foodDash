
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

const uploadsDirectory = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, { recursive: true });
}

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDirectory);
  },

  filename: (_req, file, callback) => {
    const extensions = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    const extension = extensions[file.mimetype];

    if (!extension) {
      return callback(
        new Error('Only JPG, PNG, and WEBP images are allowed.')
      );
    }

    callback(
      null,
      `${Date.now()}-${crypto.randomUUID()}${extension}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    console.log('[UPLOAD] Incoming file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error(
          `Unsupported image type: ${file.mimetype || 'unknown'}. Use JPG, PNG, or WEBP.`
        )
      );
    }

    callback(null, true);
  },
});

function buildImageUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

function getUploadedFile(req) {
  if (req.file) return req.file;

  if (Array.isArray(req.files) && req.files.length > 0) {
    return req.files[0];
  }

  return null;
}

function handleVehicleUpload(req, res) {
  console.log('[UPLOAD] Vehicle request received');

  const file = getUploadedFile(req);

  if (!file) {
    console.log('[UPLOAD] No vehicle file received');

    return res.status(400).json({
      success: false,
      message: 'No vehicle image file was received.',
    });
  }

  const photoUrl = buildImageUrl(req, file.filename);

  return res.status(201).json({
    success: true,
    message: 'Vehicle photo uploaded successfully.',
    photoUrl,
  });
}

function handleRestaurantUpload(req, res) {
  console.log('[UPLOAD] Restaurant request received');
  console.log('[UPLOAD] Content-Type:', req.headers['content-type']);

  const file = getUploadedFile(req);

  if (!file) {
    console.log('[UPLOAD] No restaurant file received');
    console.log('[UPLOAD] Parsed files:', req.files);

    return res.status(400).json({
      success: false,
      message:
        'The server received the request but did not receive an image file. Check the frontend FormData upload.',
    });
  }

  console.log('[UPLOAD] Restaurant file saved:', {
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
  });

  const imageUrl = buildImageUrl(req, file.filename);

  return res.status(201).json({
    success: true,
    message: 'Restaurant image uploaded successfully.',
    imageUrl,
    photoUrl: imageUrl,
  });
}

router.post('/vehicle', upload.any(), handleVehicleUpload);

router.post('/restaurant', upload.any(), handleRestaurantUpload);

router.use((error, req, res, _next) => {
  console.error('[UPLOAD ERROR]', {
    path: req.originalUrl,
    name: error.name,
    code: error.code,
    message: error.message,
  });

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Image size must not exceed 5 MB.'
        : error.message;

    return res.status(400).json({
      success: false,
      message,
      code: error.code,
    });
  }

  return res.status(400).json({
    success: false,
    message: error.message || 'Image upload failed.',
  });
});

module.exports = router;
