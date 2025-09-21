import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(sanitizedFilename));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Document types
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Image types
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp',
    'image/tiff',
    // Audio types
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/webm'
  ];

  // Check file type
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type: ${file.mimetype}. Only PDF, PPT, DOC, Images, and Audio files are allowed.`
    );
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files at once
    fields: 20 // Maximum 20 fields
  }
});

// Enhanced upload configurations for different use cases
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
export const uploadFields = upload.fields([
  { name: 'documents', maxCount: 5 },
  { name: 'images', maxCount: 5 },
  { name: 'audio', maxCount: 3 }
]);

// Specialized upload configurations
export const documentUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const documentTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (documentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only document files (PDF, PPT, DOC) are allowed.'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB for documents
  }
});

export const imageUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const imageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB for images
  }
});

export const audioUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const audioTypes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/webm'
    ];
    
    if (audioTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB for audio
  }
});

// Utility functions
export const getFileInfo = (file) => {
  if (!file) return null;
  
  return {
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    destination: file.destination,
    fieldname: file.fieldname
  };
};

export const validateFileSize = (file, maxSizeMB = 50) => {
  const maxSize = maxSizeMB * 1024 * 1024;
  return file.size <= maxSize;
};

export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Error handling middleware
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 50MB.',
          code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files. Maximum 10 files allowed.',
          code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field.',
          code: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'File upload error.',
          code: error.code
        });
    }
  } else if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  next(error);
};

// Default export
export default upload;