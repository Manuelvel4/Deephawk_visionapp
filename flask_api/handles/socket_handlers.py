from socketio_instance import socketio
from controllers import camera_ctrl
from flask import request

@socketio.on('captura')
def handle_captura(data):
    socket_id = request.sid
    camera_ctrl.handle_socket_captura(socket_id, data)

@socketio.on('stream')
def handle_stream(data):
    socket_id = request.sid
    camera_ctrl.handle_socket_stream(socket_id, data)