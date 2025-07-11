# routers/yolo_routes.py
from flask import Blueprint, request, jsonify
from controllers.yolo_controller import YoloController
from controllers import yolo_ctrl
from controllers import camera_ctrl

yolo_bp = Blueprint('yolo', __name__)

@yolo_bp.route('/load', methods=['POST'])
def load():
    data = request.get_json()
    model_url = data.get('model_url')
    try:
        if yolo_ctrl.is_model_url_loaded(model_url):
            print(yolo_ctrl.get_model_url())
            print(model_url)
            print("Mismo modelo ya cargado")
            return jsonify({'success': True, 'message': 'Mismo modelo ya cargado'}), 200    
        yolo_ctrl.load(model_url)
        if yolo_ctrl.is_loaded():
            print("✅ Modelo cargado correctamente")
            return jsonify({'success': True})
        else:
            print("❌ No se cargó el modelo")
            return jsonify({'success': False, 'error': 'No se cargó el modelo'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500