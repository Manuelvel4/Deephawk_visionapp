import pyrealsense2 as rs
import numpy as np
import cv2
import os
import requests
from controllers.yolo_controller import YoloController
import hashlib
from socketio_instance import socketio
import base64
import threading
import time

class CameraController:
    def __init__(self, yolo_controller: YoloController):
        self.yolo_ctrl = yolo_controller
        self.pipeline = None
        self.cap = None
        self.mode = None  # 'realsense' o 'ip'
        self.streaming = False
        self.last_frame = None
        self.stream_thread = None

    def connect(self, cam_type='realsense', ip_url=None):
        self.disconnect()  # Siempre desconectar primero

        if cam_type == 'realsense': 
            try:
                self.pipeline = rs.pipeline()
                config = rs.config()
                #config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
                config.enable_stream(rs.stream.color, 1280, 720, rs.format.bgr8, 15)

                self.pipeline.start(config)
                self.mode = 'realsense'
                self.streaming = True
                self.stream_thread = threading.Thread(target=self._stream_loop, daemon=True)
                self.stream_thread.start()
                return True
            except Exception as e:
                print(f"❌ RealSense error: {e}")
                self.pipeline = None
                return False

        elif cam_type == 'ip' and ip_url:
            self.cap = cv2.VideoCapture(ip_url)
            if self.cap.isOpened():
                self.mode = 'ip'
                self.streaming = True
                self.stream_thread = threading.Thread(target=self._stream_loop, daemon=True)
                self.stream_thread.start()
                return True
            else:
                self.cap = None
                return False

        return False

    def disconnect(self):
        self.streaming = False
        if self.pipeline:
            self.pipeline.stop()
            self.pipeline = None
        if self.cap:
            self.cap.release()
            self.cap = None
        self.mode = None
        self.last_frame = None

    def _stream_loop(self):
        while self.streaming:
            frame = None
            if self.mode == 'realsense' and self.pipeline:
                try:
                    frames = self.pipeline.wait_for_frames()
                    color_frame = frames.get_color_frame()
                    if color_frame:
                        frame = np.asanyarray(color_frame.get_data())
                except Exception as e:
                    print(f"❌ Streaming error: {e}")
            elif self.mode == 'ip' and self.cap:
                ret, f = self.cap.read()
                if ret:
                    frame = f
            self.last_frame = frame
            time.sleep(0.03)  # ~30 FPS

    def capture(self):
        return self.last_frame

    def handle_socket_captura(self, socket_id, data):
        model_url = data.get('model_url')
        cam_type = data.get('type')
        ip_url = data.get('ip_url')

        try:
            success = self.capture_and_process(socket_id, model_url, cam_type, ip_url)
            if not success:
                socketio.emit('capture_status', {'status': '❌ Fallo en captura'}, to=socket_id)
        except Exception as e:
            print("❌", e)
            socketio.emit('capture_status', {'status': f'❌ {str(e)}'}, to=socket_id)

    def _letterbox_resize(self, image, target_size):
        h, w = image.shape[:2]
        scale = min(target_size / w, target_size / h)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(image, (new_w, new_h))

        canvas = np.full((target_size, target_size, 3), 255, dtype=np.uint8)
        x_offset = (target_size - new_w) // 2
        y_offset = (target_size - new_h) // 2
        canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
        return canvas

    def capture_and_process(self, socket_id, model_url, cam_type, ip_url=None):
        from controllers import yolo_ctrl

        frame = self.last_frame

        if frame is None or not isinstance(frame, np.ndarray):
            raise Exception("❌ Imagen inválida o no capturada")

        try:
            model = self.yolo_ctrl.getModel()  
            results = model.predict(frame, imgsz=640, conf=0.5, verbose=False)[0]


            annotated = results.plot()
            resized = self._letterbox_resize(frame, 640)

            # Convertir annotated a base64
            _, buf_annotated = cv2.imencode('.jpg', annotated)
            b64_annotated = base64.b64encode(buf_annotated).decode()

            # Convertir resized a base64
            _, buf_resized = cv2.imencode('.jpg', resized)
            b64_resized = base64.b64encode(buf_resized).decode()

            # Emitir las imágenes como base64 al socket
            socketio.emit('imagenes', {
                'imagen1': b64_annotated,
                'imagen2': b64_resized
            }, to=socket_id)

        except Exception as e:
            print(f"❌ Error en procesamiento: {e}")
            return False

        return True
    
    def capture_and_process_stream(self, socket_id, model_url, cam_type, ip_url=None):
        from controllers import yolo_ctrl

        frame = self.last_frame

        if frame is None or not isinstance(frame, np.ndarray):
            raise Exception("❌ Imagen inválida o no capturada")

        try:
            model = self.yolo_ctrl.getModel()  
            results = model.predict(frame, imgsz=640, conf=0.05, verbose=False)[0]

            annotated = results.plot()

            # Convertir annotated a base64
            _, buf_annotated = cv2.imencode('.jpg', annotated)
            b64_annotated = base64.b64encode(buf_annotated).decode()

            # Emitir las imágenes como base64 al socket
            socketio.emit('imagenes', {
                'imagen1': b64_annotated,
            }, to=socket_id)

        except Exception as e:
            print(f"❌ Error en procesamiento: {e}")
            return False

        return True

    def handle_socket_stream(self, socket_id, data):
        model_url = data.get('model_url')
        cam_type = data.get('type')
        ip_url = data.get('ip_url')

        try:
            success = self.capture_and_process_stream(socket_id, model_url, cam_type, ip_url)
            if not success:
                socketio.emit('capture_status', {'status': '❌ Fallo en captura'}, to=socket_id)
        except Exception as e:
            print("❌", e)
            socketio.emit('capture_status', {'status': f'❌ {str(e)}'}, to=socket_id)
