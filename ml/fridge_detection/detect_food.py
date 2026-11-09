
from ultralytics import YOLO
from pathlib import Path

# Load pretrained model
model = YOLO("yolo26n.pt")

# Image path
image_path = input("Enter your fridge image path: ").strip().strip('"')

# Check image
if not Path(image_path).exists():
    print("Image not found!")
    exit()

# Detect objects
results = model.predict(
    source=image_path,
    conf=0.25,
    save=True
)

print("\nDetected objects:")

for result in results:
    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        name = model.names[class_id]

        print(f"{name}: {confidence:.2%}")
        
print("\nDetection completed!")
