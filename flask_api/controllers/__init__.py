# this part is used to initialize the controllers for the Flask API
# flask_api/controllers/__init__.py

from .yolo_controller import YoloController
from .camera_controller import CameraController

yolo_ctrl = YoloController()
camera_ctrl = CameraController(yolo_ctrl)  
