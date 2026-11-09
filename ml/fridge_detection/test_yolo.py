
from ultralytics import YOLO

print("Loading YOLO model...")

model = YOLO("yolo26n.pt")

print("\nYOLO model loaded successfully!")
print("\nAvailable classes:")

for class_name in model.names.values():
    print("-", class_name)
