from flask import Blueprint, jsonify, request, Response
from flask_cors import cross_origin
from socketio_instance import socketio
import base64
import cv2
from controllers import yolo_ctrl
from controllers import camera_ctrl

camera_bp = Blueprint('camera', __name__)

@camera_bp.route('/connect', methods=['POST'])
def connect():
    data = request.json
    cam_type = data.get('type')  # 'realsense' o 'ip'
    ip_url = data.get('ip_url')  # solo si type == 'ip'

    ok = camera_ctrl.connect(cam_type=cam_type, ip_url=ip_url)
    return jsonify({'success': ok})

@camera_bp.route('/disconnect', methods=['POST'])
def disconnect():
    camera_ctrl.disconnect()
    return jsonify({'success': True})

@camera_bp.route('/capture', methods=['POST'])
def capture(): 
    data = request.get_json()
    model_url = data.get('model_url')
    cam_type = data.get('type')
    ip_url = data.get('ip_url')
    socket_id = data.get('socketId')
    succes = camera_ctrl.capture_and_process(socket_id, model_url, cam_type, ip_url)
    if not succes:
        error_msg = "❌ Error al capturar imagen"
        socketio.emit('capture_status', {'status': error_msg}, to=socket_id)
        return jsonify({'error': error_msg}), 500

    return jsonify({'success': True}), 200