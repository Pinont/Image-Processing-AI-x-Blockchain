import { ImageFile as IImageFile } from '../types';
import { FILE_CONSTRAINTS, ERROR_MESSAGES } from '../constants';

/**
 * ImageFile Model Class with validation and processing methods
 */
export class ImageFile implements IImageFile {
  public file: File;
  public preview: string;
  public metadata?: {
    name: string;
    size: number;
    type: string;
  };

  constructor(file: File, preview?: string) {
    this.file = file;
    this.preview = preview || '';
    this.metadata = {
      name: file.name,
      size: file.size,
      type: file.type
    };
  }

  /**
   * Create ImageFile from File with preview generation
   */
  public static async fromFile(file: File): Promise<ImageFile> {
    const preview = await ImageFile.generatePreview(file);
    return new ImageFile(file, preview);
  }

  /**
   * Generate preview URL for the image
   */
  private static generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file type
   */
  public validateType(): { valid: boolean; error?: string } {
    if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(this.file.type)) {
      return { valid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
    }
    return { valid: true };
  }

  /**
   * Validate file size
   */
  public validateSize(): { valid: boolean; error?: string } {
    if (this.file.size > FILE_CONSTRAINTS.MAX_SIZE) {
      return { valid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
    }
    return { valid: true };
  }

  /**
   * Validate file (both type and size)
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const typeValidation = this.validateType();
    if (!typeValidation.valid && typeValidation.error) {
      errors.push(typeValidation.error);
    }

    const sizeValidation = this.validateSize();
    if (!sizeValidation.valid && sizeValidation.error) {
      errors.push(sizeValidation.error);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get file name
   */
  public getName(): string {
    return this.file.name;
  }

  /**
   * Get file size in bytes
   */
  public getSize(): number {
    return this.file.size;
  }

  /**
   * Get formatted file size
   */
  public getFormattedSize(): string {
    const bytes = this.file.size;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Get file type
   */
  public getType(): string {
    return this.file.type;
  }

  /**
   * Get file extension
   */
  public getExtension(): string {
    const name = this.file.name;
    const lastDot = name.lastIndexOf('.');
    return lastDot !== -1 ? name.substring(lastDot) : '';
  }

  /**
   * Check if image is valid
   */
  public isValid(): boolean {
    return this.validate().valid;
  }

  /**
   * Convert to Base64 string
   */
  public async toBase64(): Promise<string> {
    if (this.preview) {
      return this.preview;
    }
    return ImageFile.generatePreview(this.file);
  }

  /**
   * Get image dimensions
   */
  public async getDimensions(): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = this.preview;
    });
  }

  /**
   * Create FormData for upload
   */
  public toFormData(fieldName: string = 'image'): FormData {
    const formData = new FormData();
    formData.append(fieldName, this.file);
    return formData;
  }

  /**
   * Get metadata object
   */
  public getMetadata(): { name: string; size: number; type: string; formattedSize: string; extension: string } {
    return {
      name: this.getName(),
      size: this.getSize(),
      type: this.getType(),
      formattedSize: this.getFormattedSize(),
      extension: this.getExtension()
    };
  }

  /**
   * Revoke preview URL to free memory
   */
  public cleanup(): void {
    if (this.preview && this.preview.startsWith('blob:')) {
      URL.revokeObjectURL(this.preview);
    }
  }

  /**
   * Convert to plain object for serialization
   */
  public toJSON(): IImageFile {
    return {
      file: this.file,
      preview: this.preview,
      metadata: this.metadata
    };
  }

  /**
   * Check if file is an image
   */
  public static isImageFile(file: File): boolean {
    return FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type);
  }

  /**
   * Validate file without creating instance
   */
  public static validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
      errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }

    if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
      errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
