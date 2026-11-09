
import os
import tempfile
import base64
from io import BytesIO

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image, UnidentifiedImageError

app = FastAPI(title="Smart Fridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load fruit and vegetable detection model
BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR, "ml", "food_model", "fruit_veg_best.pt"
)

model = YOLO(MODEL_PATH)


@app.get("/")
def home():
    return {
        "message": "Welcome to SmartFridge API!",
        "status": "running"
    }


@app.post("/api/scan")
async def scan_fridge(image: UploadFile = File(...)):

    allowed_types = ["image/jpeg", "image/png", "image/webp"]

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG or WEBP image."
        )

    image_data = await image.read()

    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image must be smaller than 10 MB."
        )

    temp_path = None

    try:
        # Validate uploaded image
        Image.open(BytesIO(image_data)).verify()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".jpg"
        ) as temp_file:
            temp_file.write(image_data)
            temp_path = temp_file.name

        # Run food detection
        results = model.predict(
            source=temp_path,
            conf=0.25,
            save=False
        )

        detections = []
        annotated_image = None

        for result in results:

            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])

                detections.append({
                    "name": model.names[class_id],
                    "confidence": round(confidence * 100, 2)
                })

            # Draw detection boxes
            annotated = result.plot()

            output_image = Image.fromarray(
                annotated[:, :, ::-1]
            )

            buffer = BytesIO()
            output_image.save(buffer, format="JPEG")

            encoded_image = base64.b64encode(
                buffer.getvalue()
            ).decode("utf-8")

            annotated_image = (
                f"data:image/jpeg;base64,{encoded_image}"
            )

        # Remove duplicate ingredient names
        unique_ingredients = list({
            item["name"] for item in detections
        })

        return {
            "filename": image.filename,
            "status": "success",
            "ai_detection": "Food detection completed",
            "detections": detections,
            "ingredients": unique_ingredients,
            "annotated_image": annotated_image
        }

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Image analysis failed: {str(error)}"
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
