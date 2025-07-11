import argparse
from ultralytics import YOLO

parser = argparse.ArgumentParser()
parser.add_argument('--project', required=True, help='ID del proyecto')
parser.add_argument('--model', default='yolov8n', help='Modelo base YOLOv8 a usar (e.g., yolov8n, yolov8s, yolov8m)')
parser.add_argument('--epochs', type=int, default=50, help='Número de épocas para entrenar')
parser.add_argument('--imgsz', type=int, default=640, help='Tamaño de la imagen para el entrenamiento')
parser.add_argument('--data_path', type=str, help='Ruta al archivo de datos YAML')
parser.add_argument('--project_path', type=str, default='', help='Ruta al proyecto donde se guardarán los resultados')
parser.add_argument('--name', type=str, default='yolov8_model', help='Nombre del modelo guardado')

args = parser.parse_args()

# Cargar el modelo base
model = YOLO(f"{args.model}.pt")

# Entrenar
model.train(
    data=args.data_path,
    epochs=args.epochs,
    imgsz=args.imgsz,
    project=args.project_path,
    name=args.name
)
