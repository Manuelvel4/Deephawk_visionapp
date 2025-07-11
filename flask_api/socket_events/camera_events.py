# import os, hashlib, cv2, numpy as np
# from flask_socketio import emit
# from socketio_instance import socketio
# from controllers.camera_controller import CameraController
# from ultralytics import YOLO

# camera_ctrl = CameraController()

# @socketio.on('capture_photo')
# def handle_capture(data):
#     model_url = data.get('model_url')
#     cam_type = data.get('type')
#     ip_url = data.get('ip_url', None)

#     try:
#         emit('capture_status', {'status': '📸 Conectando cámara...'})
#         if not camera_ctrl.connect(cam_type, ip_url):
#             emit('capture_status', {'status': '❌ No se pudo conectar a la cámara'})
#             return

#         frame = camera_ctrl.capture()
#         if frame is None:
#             emit('capture_status', {'status': '❌ No se pudo capturar imagen'})
#             return

#         # Buscar modelo
#         modelo_dir = os.path.join(os.path.dirname(__file__), '..', 'modelyolo')
#         modelo_hash = hashlib.md5(model_url.encode()).hexdigest()
#         modelo_path = os.path.join(modelo_dir, f"{modelo_hash}.pt")

#         if not os.path.exists(modelo_path):
#             emit('capture_status', {'status': '❌ Modelo no encontrado'})
#             return

#         model = YOLO(modelo_path)
#         results = model.predict(frame, imgsz=640, conf=0.3, verbose=False)[0]
#         annotated = results.plot()
#         resized = cv2.resize(frame, (640, 640))

#         _, img_encoded = cv2.imencode('.jpg', annotated)
#         _, img_resized = cv2.imencode('.jpg', resized)

#         emit('capture_image', {
#             'detected': img_encoded.tobytes().hex(),
#             'resized': img_resized.tobytes().hex()
#         })
#         emit('capture_status', {'status': '✅ Imagen capturada y procesada'})

#     except Exception as e:
#         emit('capture_status', {'status': f'❌ Error: {str(e)}'})
#         socketio.disconnect()
# @socketio.on('connect')
# def handle_connect():
#     emit('log', {'data': '✅ Cliente conectado vía Socket.IO'}, broadcast=True)

# @socketio.on('disconnect')
# def handle_disconnect():
#     emit('log', {'data': '🔌 Cliente desconectado'}, broadcast=True)