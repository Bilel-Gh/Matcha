import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PhotoRepository, Photo, CreatePhotoData } from '../repositories/PhotoRepository';
import { AppError } from '../utils/AppError';

export interface PhotoResponse {
  id: number;
  filename: string;
  url: string;
  is_profile: boolean;
  created_at: string;
}

export interface PhotosListResponse {
  photos: PhotoResponse[];
  count: number;
  max_photos: number;
  has_profile_picture: boolean;
}

export interface UploadResponse {
  success: boolean;
  photo: PhotoResponse;
  count: number;
}

export class PhotoService {
  private static readonly MAX_PHOTOS = 5;
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'photos');

  static async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }
  }

  static generateFileName(userId: number, originalName: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    const ext = path.extname(originalName).toLowerCase();
    return `${userId}_${timestamp}_${uuid}${ext}`;
  }

  static validateFile(file: Express.Multer.File): void {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.mimetype)) {
      throw new AppError('Only JPEG and PNG files are allowed', 400);
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new AppError('File size must be under 5MB', 400);
    }

    // Validate file headers (magic numbers)
    this.validateFileHeaders(file.buffer);
  }

  private static validateFileHeaders(buffer: Buffer): void {
    // JPEG magic numbers: FF D8 FF
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

    // PNG magic numbers: 89 50 4E 47 0D 0A 1A 0A
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

    if (!isJPEG && !isPNG) {
      throw new AppError('Invalid file format. Only JPEG and PNG files are allowed', 400);
    }
  }

  static formatPhotoResponse(photo: Photo): PhotoResponse {
    return {
      id: photo.id,
      filename: photo.filename,
      url: photo.url,
      is_profile: photo.is_profile,
      created_at: photo.created_at.toISOString(),
    };
  }

  static async getUserPhotos(userId: number): Promise<PhotosListResponse> {
    const photos = await PhotoRepository.findByUserId(userId);
    const hasProfilePicture = await PhotoRepository.hasProfilePhoto(userId);

    return {
      photos: photos.map(this.formatPhotoResponse),
      count: photos.length,
      max_photos: this.MAX_PHOTOS,
      has_profile_picture: hasProfilePicture,
    };
  }

  static async uploadPhoto(userId: number, file: Express.Multer.File): Promise<UploadResponse> {
    // Validate file
    this.validateFile(file);

    // Check photo count limit
    const currentCount = await PhotoRepository.countByUserId(userId);
    if (currentCount >= this.MAX_PHOTOS) {
      throw new AppError('Maximum 5 photos allowed', 400);
    }

    // Ensure upload directory exists
    await this.ensureUploadDirectory();

    // Generate unique filename
    const filename = this.generateFileName(userId, file.originalname);
    const filePath = path.join(this.UPLOAD_DIR, filename);
    const url = `/uploads/photos/${filename}`;

    try {
      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Save to database
      const photoData: CreatePhotoData = {
        user_id: userId,
        filename,
        url,
        is_profile: false,
      };

      const photo = await PhotoRepository.create(photoData);

      return {
        success: true,
        photo: this.formatPhotoResponse(photo),
        count: currentCount + 1,
      };
    } catch (error) {
      // Clean up file if database save fails
      try {
        await fs.unlink(filePath);
      } catch {}

      throw new AppError('Failed to upload photo', 500);
    }
  }

  static async setProfilePhoto(userId: number, photoId: number): Promise<PhotoResponse> {
    // Check if photo exists and belongs to user
    const photo = await PhotoRepository.findById(photoId);

    if (!photo) {
      throw new AppError('Photo not found', 404);
    }

    if (photo.user_id !== userId) {
      throw new AppError('Cannot set another user\'s photo as profile', 403);
    }

    // Update profile photo
    const updatedPhoto = await PhotoRepository.updateProfilePhoto(userId, photoId);

    if (!updatedPhoto) {
      throw new AppError('Failed to update profile photo', 500);
    }

    return this.formatPhotoResponse(updatedPhoto);
  }

  static async deletePhoto(userId: number, photoId: number): Promise<void> {
    // Delete from database (this also checks ownership)
    const deletedPhoto = await PhotoRepository.delete(photoId, userId);

    if (!deletedPhoto) {
      throw new AppError('Photo not found or unauthorized', 404);
    }

    // Delete file from filesystem
    const filePath = path.join(this.UPLOAD_DIR, deletedPhoto.filename);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Log error but don't throw - database deletion succeeded
      console.error('Failed to delete file:', filePath, error);
    }
  }

  static async deleteUserPhotos(userId: number): Promise<void> {
    // Get all user photos
    const photos = await PhotoRepository.findByUserId(userId);

    // Delete all files
    await Promise.all(
      photos.map(async (photo) => {
        const filePath = path.join(this.UPLOAD_DIR, photo.filename);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Failed to delete file:', filePath, error);
        }
      })
    );

    // Note: Database photos will be deleted automatically by CASCADE
  }
}
