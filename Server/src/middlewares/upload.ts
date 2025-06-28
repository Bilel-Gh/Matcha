import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/AppError';

// Configure multer to use memory storage (files will be in buffer)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG and PNG files are allowed', 400));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time
  },
});

export const uploadSingle = upload.single('photo');

// Error handling middleware for multer
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(200).json({
        success: false,
        message: 'File size must be under 5MB',
        error: 'FILE_TOO_LARGE'
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(200).json({
        success: false,
        message: 'Only one file allowed per upload',
        error: 'TOO_MANY_FILES'
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(200).json({
        success: false,
        message: 'Unexpected field name. Use "photo" as field name',
        error: 'INVALID_FIELD_NAME'
      });
    }
  }

  next(error);
};
