const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories
const subdirs = ['photos', 'documents', 'logos', 'temp'];
subdirs.forEach(dir => {
  const dirPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// File type configurations
const fileTypes = {
  images: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  documents: {
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    extensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSize: 10 * 1024 * 1024 // 10MB
  }
};

// Upload file to cloud storage (placeholder for future implementation)
const uploadToCloud = async (filePath, destination) => {
  // Implement cloud storage upload (AWS S3, Cloudinary, etc.)
  // For now, just return local path
  return filePath;
};

// Delete file
const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Get file info
const getFileInfo = async (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
    const stats = fs.statSync(fullPath);
    return {
      exists: true,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    return { exists: false };
  }
};

// Move file from temp to permanent location
const moveFromTemp = async (tempPath, destination) => {
  try {
    const destDir = path.join(uploadsDir, destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const fileName = path.basename(tempPath);
    const destPath = path.join(destDir, fileName);
    
    fs.renameSync(tempPath, destPath);
    return `/uploads/${destination}/${fileName}`;
  } catch (error) {
    console.error('Error moving file:', error);
    throw error;
  }
};

// Clean up old temp files (call periodically)
const cleanupTempFiles = async (maxAgeHours = 24) => {
  const tempDir = path.join(uploadsDir, 'temp');
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  const now = Date.now();
  
  try {
    const files = fs.readdirSync(tempDir);
    let deleted = 0;
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    }
    
    return { deleted, total: files.length };
  } catch (error) {
    console.error('Error cleaning temp files:', error);
    return { error: error.message };
  }
};

module.exports = {
  uploadToCloud,
  deleteFile,
  getFileInfo,
  moveFromTemp,
  cleanupTempFiles,
  uploadsDir
};
