import { Detection as IDetection, DetectionResult } from '../types';

/**
 * Detection Model Class for YOLO detection results
 */
export class Detection implements IDetection {
  public class: string;
  public confidence: number;
  public box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };

  constructor(data: IDetection) {
    this.class = data.class;
    this.confidence = data.confidence;
    this.box = { ...data.box };
  }

  /**
   * Get confidence as percentage
   */
  public getConfidencePercent(): string {
    return `${(this.confidence * 100).toFixed(1)}%`;
  }

  /**
   * Get bounding box dimensions
   */
  public getBoundingBox(): { width: number; height: number; area: number } {
    const width = this.box.x2 - this.box.x1;
    const height = this.box.y2 - this.box.y1;
    return {
      width,
      height,
      area: width * height
    };
  }

  /**
   * Get box center point
   */
  public getCenter(): { x: number; y: number } {
    return {
      x: (this.box.x1 + this.box.x2) / 2,
      y: (this.box.y1 + this.box.y2) / 2
    };
  }

  /**
   * Format for display
   */
  public toDisplay(): string {
    return `${this.class} (${this.getConfidencePercent()})`;
  }

  /**
   * Check if detection is high confidence (>70%)
   */
  public isHighConfidence(): boolean {
    return this.confidence > 0.7;
  }

  /**
   * Check if detection is medium confidence (40-70%)
   */
  public isMediumConfidence(): boolean {
    return this.confidence >= 0.4 && this.confidence <= 0.7;
  }

  /**
   * Check if detection is low confidence (<40%)
   */
  public isLowConfidence(): boolean {
    return this.confidence < 0.4;
  }

  /**
   * Get confidence level as string
   */
  public getConfidenceLevel(): 'high' | 'medium' | 'low' {
    if (this.isHighConfidence()) return 'high';
    if (this.isMediumConfidence()) return 'medium';
    return 'low';
  }

  /**
   * Convert to plain object for serialization
   */
  public toJSON(): IDetection {
    return {
      class: this.class,
      confidence: this.confidence,
      box: { ...this.box }
    };
  }

  /**
   * Validate detection data
   */
  public validate(): boolean {
    if (!this.class || typeof this.confidence !== 'number') return false;
    if (this.confidence < 0 || this.confidence > 1) return false;
    if (!this.box || typeof this.box.x1 !== 'number') return false;
    return true;
  }

  /**
   * Create a copy of the detection
   */
  public clone(): Detection {
    return new Detection(this.toJSON());
  }
}

/**
 * DetectionResultModel - Wrapper for multiple detections
 */
export class DetectionResultModel {
  public detections: Detection[];
  public annotated_image: string;

  constructor(data: DetectionResult) {
    this.detections = data.detections.map(d => new Detection(d));
    this.annotated_image = data.annotated_image;
  }

  /**
   * Get detection count
   */
  public getDetectionCount(): number {
    return this.detections.length;
  }

  /**
   * Check if any detections found
   */
  public hasDetections(): boolean {
    return this.detections.length > 0;
  }

  /**
   * Get detections by class name
   */
  public getDetectionsByClass(className: string): Detection[] {
    return this.detections.filter(d => d.class === className);
  }

  /**
   * Get unique class names
   */
  public getUniqueClasses(): string[] {
    return Array.from(new Set(this.detections.map(d => d.class)));
  }

  /**
   * Get high confidence detections only
   */
  public getHighConfidenceDetections(): Detection[] {
    return this.detections.filter(d => d.isHighConfidence());
  }

  /**
   * Get detection summary
   */
  public getSummary(): string {
    if (!this.hasDetections()) return 'No objects detected';
    
    const classes = this.getUniqueClasses();
    if (classes.length === 1) {
      return `Found ${this.getDetectionCount()} ${classes[0]}${this.getDetectionCount() > 1 ? 's' : ''}`;
    }
    return `Found ${this.getDetectionCount()} objects (${classes.length} types)`;
  }

  /**
   * Get formatted detection list
   */
  public getFormattedList(): string[] {
    return this.detections.map(d => d.toDisplay());
  }

  /**
   * Group detections by class
   */
  public groupByClass(): Map<string, Detection[]> {
    const grouped = new Map<string, Detection[]>();
    this.detections.forEach(detection => {
      const existing = grouped.get(detection.class) || [];
      existing.push(detection);
      grouped.set(detection.class, existing);
    });
    return grouped;
  }

  /**
   * Get class counts
   */
  public getClassCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    this.detections.forEach(detection => {
      counts.set(detection.class, (counts.get(detection.class) || 0) + 1);
    });
    return counts;
  }

  /**
   * Sort detections by confidence
   */
  public sortByConfidence(descending: boolean = true): Detection[] {
    return [...this.detections].sort((a, b) => 
      descending ? b.confidence - a.confidence : a.confidence - b.confidence
    );
  }

  /**
   * Convert to plain object for serialization
   */
  public toJSON(): DetectionResult {
    return {
      detections: this.detections.map(d => d.toJSON()),
      annotated_image: this.annotated_image
    };
  }

  /**
   * Validate detection result
   */
  public validate(): boolean {
    if (!Array.isArray(this.detections)) return false;
    if (!this.annotated_image) return false;
    return this.detections.every(d => d.validate());
  }
}
