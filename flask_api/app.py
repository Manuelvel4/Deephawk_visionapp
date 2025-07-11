
from flask import Flask
from routers.camera_routes import camera_bp
from routers.yolo_routes import yolo_bp
from socketio_instance import socketio 
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app, origins="*")
    app.register_blueprint(camera_bp, url_prefix='/camera')
    app.register_blueprint(yolo_bp, url_prefix='/yolo')
    socketio.init_app(app)

    return app
    