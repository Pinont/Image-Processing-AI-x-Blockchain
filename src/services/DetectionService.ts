
import { DetectionResult, Detection } from '../types';

export class DetectionService {
    private static instance: DetectionService;
    private apiUrl = 'http://localhost:8000/chat';

    private constructor() { }

    public static getInstance(): DetectionService {
        if (!DetectionService.instance) {
            DetectionService.instance = new DetectionService();
        }
        return DetectionService.instance;
    }

    public async detect(image: string | File): Promise<DetectionResult> {
        let base64Image: string;

        if (image instanceof File) {
            base64Image = await this.fileToBase64(image);
        } else {
            // Assume it's already a base64 string (potentially with data: prefix)
            base64Image = image;
        }

        // Strip prefix if present
        if (base64Image.includes(',')) {
            base64Image = base64Image.split(',')[1];
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: 'Analyze this image', // Default message for API
                    image: base64Image,
                }),
            });

            if (!response.ok) {
                throw new Error(`Detection API error: ${response.status}`);
            }

            const data = await response.json();

            const detections: Detection[] = data.detections || [];
            const annotated_image = data.annotated_image;

            return {
                detections,
                annotated_image,
                timestamp: Date.now()
            } as any;

        } catch (error) {
            console.error('DetectionService error:', error);
            throw error;
        }
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

export default DetectionService.getInstance();
