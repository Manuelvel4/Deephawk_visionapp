import os
import requests
from ultralytics import YOLO
import time 

class YoloController:

    def __init__(self):
        self.model = None
        self.model_url = None
        
    def getModel(self):
        if self.model is None:
            raise ValueError("Modelo no cargado. Usa load primero.")
        return self.model

    def is_loaded(self):
        return self.model is not None
    
    def get_model_url(self):
        if self.model_url is None:
            raise ValueError("URL del modelo no cargada. Usa load primero.")
        return self.model_url

    def is_model_url_loaded(self, model_url):
        if self.model_url is None:
            return False
        return self.model_url == model_url

    def load(self, model_url):
        import hashlib
        import glob

        modelo_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        if not os.path.exists(modelo_dir):
            os.makedirs(modelo_dir)

        # 🔥 Eliminar todos los modelos anteriores (.pt)
        for archivo in glob.glob(os.path.join(modelo_dir, '*.pt')):
            try:
                os.remove(archivo)
            except Exception as e:
                print(f"⚠️ No se pudo eliminar {archivo}: {e}")

        # 💡 Generar nombre único por hash del URL
        modelo_hash = hashlib.md5(model_url.encode()).hexdigest()
        modelo_path = os.path.join(modelo_dir, f"{modelo_hash}.pt")

        # ⬇️ Descargar si no existe ya
        if not os.path.exists(modelo_path):
            print(f"⏬ Descargando modelo desde: {model_url}")
            response = requests.get(model_url)
            if response.status_code != 200:
                raise Exception("❌ No se pudo descargar el modelo")
            with open(modelo_path, 'wb') as f:
                f.write(response.content)
        time.sleep(5)  # Esperar un segundo para asegurar que el archivo esté listo
        model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
        model_hash = hashlib.md5(model_url.encode()).hexdigest()
        model_path = os.path.join(model_dir, f"{model_hash}.pt")

        if not os.path.exists(model_path):
            raise FileNotFoundError("Modelo no encontrado. Debes cargarlo primero.")

        self.model_url = model_url
        self.model = YOLO(model_path)