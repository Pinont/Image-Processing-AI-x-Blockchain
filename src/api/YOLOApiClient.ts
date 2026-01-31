import { YOLOApiResponse, DetectionResult } from '../types';
import { API_ENDPOINTS } from '../constants';

/**
 * YOLOApiClient - API client for YOLO detection server
 */
export class YOLOApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_ENDPOINTS.YOLO_DETECT) {
    this.baseUrl = baseUrl;
  }

  /**
   * Detect objects in image
   */
  public async detect(formData: FormData): Promise<YOLOApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
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
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check server health
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Set base URL
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }
}

export default new YOLOApiClient();
