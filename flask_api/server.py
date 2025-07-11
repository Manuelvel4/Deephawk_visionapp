
from app import create_app
from socketio_instance import socketio
from dotenv import load_dotenv
import os
import handles.socket_handlers

load_dotenv()
app = create_app()
port = int(os.getenv('FLASK_PORT', 5055))

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=port, debug=False)

