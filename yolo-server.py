import uvicorn
import base64
import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO

# Load YOLO model
model = YOLO("yolo11x.pt")

app = FastAPI()

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageRequest(BaseModel):
    image: str  # Base64 string

class ChatRequest(BaseModel):
    message: str
    image: str = None  # Optional Base64 image

@app.post("/detect")
async def detect_objects(req: ImageRequest):
    try:
        # Convert Base64 back to image
        image_data = base64.b64decode(req.image)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Run YOLO detection
        results = model(img)
        
        # Get annotated image with boxes drawn by YOLO
        annotated_img = results[0].plot()  # YOLO draws boxes automatically
        
        # Convert annotated image back to base64
        _, buffer = cv2.imencode('.jpg', annotated_img)
        annotated_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Count detected objects and collect detection info
        object_counts = {}
        detections = []
        
        for r in results:
            for box in r.boxes:
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                confidence = float(box.conf[0])
                
                # Get bounding box coordinates (xyxy format)
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                object_counts[class_name] = object_counts.get(class_name, 0) + 1
                
                detections.append({
                    "class": class_name,
                    "confidence": confidence,
                    "box": {
                        "x1": int(x1),
                        "y1": int(y1),
                        "x2": int(x2),
                        "y2": int(y2)
                    }
                })
        
        # Return summary with annotated image
        if not object_counts:
            return {
                "message": "No recognizable objects found in this image.",
                "detections": [],
                "annotated_image": f"data:image/jpeg;base64,{annotated_base64}"
            }
        
        summary = ", ".join([f"{name} ({count})" for name, count in object_counts.items()])
        return {
            "message": f"YOLO detected: {summary}",
            "detections": detections,
            "annotated_image": f"data:image/jpeg;base64,{annotated_base64}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(req: ChatRequest):
    try:
        # If image provided, run YOLO detection
        if req.image:
            image_data = base64.b64decode(req.image)
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            results = model(img)
            
            # Get annotated image with boxes drawn by YOLO
            annotated_img = results[0].plot()
            
            # Convert annotated image back to base64
            _, buffer = cv2.imencode('.jpg', annotated_img)
            annotated_base64 = base64.b64encode(buffer).decode('utf-8')
            
            object_counts = {}
            detections = []
            
            for r in results:
                for box in r.boxes:
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id]
                    confidence = float(box.conf[0])
                    object_counts[class_name] = object_counts.get(class_name, 0) + 1
                    
                    # Get bounding box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    detections.append({
                        "class": class_name,
                        "confidence": confidence,
                        "box": {
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2)
                        }
                    })
            
            if object_counts:
                objects_text = ", ".join([f"{count} {name}" if count > 1 else f"1 {name}" for name, count in object_counts.items()])
                response = f"I analyzed the image and detected: {objects_text}."
            else:
                response = "I didn't detect any recognizable objects in this image. Could you try with a different image or ask me something else?"
            
            return {
                "response": response,
                "detections": detections,
                "annotated_image": f"data:image/jpeg;base64,{annotated_base64}"
            }
        else:
            # Simple chat response without image
            response = f"I received your message: '{req.message}'. I'm a YOLO object detection assistant. Upload an image and I'll tell you what objects I can detect!"
            return {"response": response}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 YOLO Server running on http://localhost:8000")
    print("📸 Ready for object detection!")
    uvicorn.run(app, host="0.0.0.0", port=8000)
