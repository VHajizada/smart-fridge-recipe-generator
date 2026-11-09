
from ultralytics import YOLO
from pathlib import Path

print("Loading Food Detection Model...")

model = YOLO("ml/food_model/best.pt")

print("\nModel loaded successfully!")
print("\nAvailable food classes:")

for class_id, name in model.names.items():
    print(f"{class_id}: {name}")

image_path = input("\nEnter your fridge image path: ").strip().strip('"')

if not Path(image_path).exists():
    print("Image not found!")
    exit()

print("\nAnalyzing fridge image...")

results = model.predict(
    source=image_path,
    conf=0.25,
    save=True
)

print("\nDetected food items:")

for result in results:
    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        name = model.names[class_id]
        print(f"{name}: {confidence:.2%}")

print("\nFood detection completed!")
