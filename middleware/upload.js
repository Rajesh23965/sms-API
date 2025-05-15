// config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploader = (folder) => {
  // Ensure upload directory exists
  const uploadDir = `public/uploads/${folder}`;
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `${folder}-${uniqueSuffix}${ext}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error(`Only images are allowed (jpeg, jpg, png) for ${folder}`));
    }
  };

  return multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, 
    fileFilter: fileFilter
  });
};

// Create specific uploaders
const studentUpload = createUploader('students');
const teacherUpload = createUploader('teachers');
const schoolUpload=createUploader('school');
module.exports = {
  studentUpload,
  teacherUpload,
  schoolUpload
};