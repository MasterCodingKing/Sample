const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const subdirs = ['photos', 'documents', 'attachments', 'logos'];

subdirs.forEach(subdir => {
  const dir = path.join(uploadsDir, subdir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'attachments';
    
    if (file.fieldname === 'photo' || file.mimetype.startsWith('image/')) {
      folder = 'photos';
    } else if (file.fieldname === 'document') {
      folder = 'documents';
    } else if (file.fieldname === 'logo') {
      folder = 'logos';
    }
    
    cb(null, path.join(uploadsDir, folder));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Image only filter
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Max file size (5MB default)
const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

// Upload configurations
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize }
});

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: maxSize }
});

// Middleware for single file upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
          });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

// Middleware for multiple files upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ 
            message: `Too many files. Maximum is ${maxCount}` 
          });
        }
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

// Delete file helper
const deleteFile = (filePath) => {
  const fullPath = path.join(uploadsDir, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

// Get file URL helper
const getFileUrl = (filename, folder = 'attachments') => {
  if (!filename) return null;
  return `/uploads/${folder}/${filename}`;
};

module.exports = {
  upload,
  uploadImage,
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getFileUrl
};
