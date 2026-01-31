import { DetectionResult, YOLOApiResponse } from '../types';
import { DetectionResultModel } from '../models/Detection';
import { ImageFile } from '../models/ImageFile';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../constants';
import EventManager, { EVENTS } from '../managers/EventManager';

/**
 * YOLODetectionService - Service class for YOLO object detection
 */
export class YOLODetectionService {
  private static instance: YOLODetectionService;
  private eventManager: typeof EventManager;

  private constructor() {
    this.eventManager = EventManager;
  }

  public static getInstance(): YOLODetectionService {
    if (!YOLODetectionService.instance) {
      YOLODetectionService.instance = new YOLODetectionService();
    }
    return YOLODetectionService.instance;
  }

  /**
   * Detect objects in an image
   */
  public async detectObjects(imageFile: ImageFile): Promise<DetectionResultModel> {
    this.eventManager.emit(EVENTS.DETECTION_STARTED);

    try {
      // Validate image
      const validation = imageFile.validate();
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      // Send to YOLO API
      const result = await this.sendToYOLOAPI(imageFile);

      if (!result.success || !result.data) {
        throw new Error(result.error || ERROR_MESSAGES.DETECTION_FAILED);
      }

      const detectionResult = new DetectionResultModel(result.data);
      this.eventManager.emit(EVENTS.DETECTION_COMPLETED, detectionResult);

      return detectionResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.DETECTION_FAILED;
      this.eventManager.emit(EVENTS.DETECTION_FAILED, errorMessage);
      throw error;
    }
  }

  /**
   * Send image to YOLO API
   */
  private async sendToYOLOAPI(imageFile: ImageFile): Promise<YOLOApiResponse> {
    try {
      const formData = imageFile.toFormData('image');

      const response = await fetch(API_ENDPOINTS.YOLO_DETECT, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: DetectionResult = await response.json();
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('YOLO API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.NETWORK_ERROR
      };
    }
  }

  /**
   * Detect objects from base64 image string
   */
  public async detectFromBase64(base64Image: string): Promise<DetectionResultModel> {
    try {
      // Convert base64 to blob
      const blob = await this.base64ToBlob(base64Image);
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
      const imageFile = await ImageFile.fromFile(file);

      return this.detectObjects(imageFile);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert base64 to blob
   */
  private async base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
  }

  /**
   * Check if YOLO server is available
   */
  public async checkServerStatus(): Promise<boolean> {
    try {
      const response = await fetch(API_ENDPOINTS.YOLO_DETECT, {
        method: 'HEAD'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get detection statistics from result
   */
  public getDetectionStats(result: DetectionResultModel): {
    total: number;
    highConfidence: number;
    uniqueClasses: number;
    classCounts: Map<string, number>;
  } {
    return {
      total: result.getDetectionCount(),
      highConfidence: result.getHighConfidenceDetections().length,
      uniqueClasses: result.getUniqueClasses().length,
      classCounts: result.getClassCounts()
    };
  }
}

export default YOLODetectionService.getInstance();
