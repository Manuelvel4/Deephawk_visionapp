from ultralytics import YOLO
import pyrealsense2 as rs
import numpy as np
import cv2
import os

# 📦 Cargar el modelo desde S3
model = YOLO("https://bucker-tfm-app-velastegui.s3.eu-north-1.amazonaws.com/41e170e0-ca7f-49e6-9bad-58b19018d1c8/ModeloNuevo/best.pt")

# 🎥 Configurar la cámara RealSense
pipeline = rs.pipeline()
config = rs.config()
config.enable_stream(rs.stream.color, 1280, 720, rs.format.bgr8, 15)

print("🔄 Iniciando cámara RealSense...")
pipeline.start(config)  

try:
    print("📸 Capturando imagen...")
    for i in range(30):  # Esperar a que la cámara se estabilice
        frames = pipeline.wait_for_frames()
    color_frame = frames.get_color_frame()

    if not color_frame:
        raise RuntimeError("❌ No se pudo capturar el frame de la cámara.")

    # 🖼 Convertir frame a imagen numpy
    color_image = np.asanyarray(color_frame.get_data())

    # ✅ Procesar con YOLO directamente el array de imagen
    results = model(color_image)

    # 📂 Guardar la imagen con las predicciones
    output_dir = "predicciones"
    os.makedirs(output_dir, exist_ok=True)
    results[0].save(filename=os.path.join(output_dir, 'resultado.jpg'))

    # 📊 Mostrar resultados por consola
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0])
            conf = float(box.conf[0])
            print(f"🔹 Clase detectada: {model.names[class_id]} - Confianza: {conf:.2f}")

finally:
    print("🛑 Deteniendo cámara...")
    pipeline.stop()

