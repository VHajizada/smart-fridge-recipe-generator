
from ultralytics import YOLO
from pathlib import Path

print("Loading Fruit and Vegetable Detection Model...")

model = YOLO("ml/food_model/fruit_veg_best.pt")

print("Model loaded successfully!")
print("Number of classes:", len(model.names))

image_path = input("\nEnter your fridge image path: ").strip().strip('"')

if not Path(image_path).exists():
    print("Image not found!")
    exit()

print("\nAnalyzing fridge image...")

results = model.predict(
    source=image_path,
    conf=0.10,
    save=True
)

print("\nDetected ingredients:")

detected_items = set()

for result in results:
    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        name = model.names[class_id]

        detected_items.add(name)

        print(f"{name}: {confidence:.2%}")

print("\nUnique ingredients:", list(detected_items))
print("\nDetection completed!")
