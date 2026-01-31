import { ImageFile } from '../models/ImageFile';
import EventManager, { EVENTS } from '../managers/EventManager';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

/**
 * ImageUploadService - Service class for handling image uploads
 */
export class ImageUploadService {
  private static instance: ImageUploadService;
  private eventManager: typeof EventManager;

  private constructor() {
    this.eventManager = EventManager;
  }

  public static getInstance(): ImageUploadService {
    if (!ImageUploadService.instance) {
      ImageUploadService.instance = new ImageUploadService();
    }
    return ImageUploadService.instance;
  }

  /**
   * Upload image file
   */
  public async uploadImage(file: File): Promise<ImageFile> {
    this.eventManager.emit(EVENTS.UPLOAD_STARTED);

    try {
      // Validate file first
      const validation = ImageFile.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Create ImageFile instance
      const imageFile = await ImageFile.fromFile(file);

      this.eventManager.emit(EVENTS.UPLOAD_COMPLETED, imageFile);
      return imageFile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UPLOAD_FAILED;
      this.eventManager.emit(EVENTS.UPLOAD_FAILED, errorMessage);
      throw error;
    }
  }

  /**
   * Upload multiple images
   */
  public async uploadMultipleImages(files: File[]): Promise<ImageFile[]> {
    const results: ImageFile[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const imageFile = await this.uploadImage(file);
        results.push(imageFile);
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Upload failed'}`);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`All uploads failed: ${errors.join(', ')}`);
    }

    return results;
  }

  /**
   * Validate file before upload
   */
  public validateFile(file: File): { valid: boolean; errors: string[] } {
    return ImageFile.validateFile(file);
  }

  /**
   * Check if file is valid image
   */
  public isValidImage(file: File): boolean {
    return ImageFile.isImageFile(file);
  }

  /**
   * Handle drag and drop file
   */
  public async handleDroppedFile(dataTransfer: DataTransfer): Promise<ImageFile | null> {
    const files = Array.from(dataTransfer.files);
    
    if (files.length === 0) {
      throw new Error('No files dropped');
    }

    const imageFiles = files.filter(file => this.isValidImage(file));

    if (imageFiles.length === 0) {
      throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    // Take first valid image
    return this.uploadImage(imageFiles[0]);
  }

  /**
   * Get file preview URL
   */
  public async getFilePreview(file: File): Promise<string> {
    const imageFile = await ImageFile.fromFile(file);
    return imageFile.preview;
  }

  /**
   * Cleanup image file
   */
  public cleanup(imageFile: ImageFile): void {
    imageFile.cleanup();
  }

  /**
   * Convert file to base64
   */
  public async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get image dimensions
   */
  public async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Compress image if needed
   */
  public async compressImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 0.9
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Upload to IPFS (placeholder - implement with actual IPFS service)
   */
  public async uploadToIPFS(imageFile: ImageFile): Promise<{
    hash: string;
    url: string;
    gateway: string;
  }> {
    // This is a placeholder implementation
    // In a real application, you would integrate with an IPFS service like Pinata or Infura
    throw new Error('IPFS upload not implemented');
  }
}

export default ImageUploadService.getInstance();
