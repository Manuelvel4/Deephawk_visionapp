import { Router } from 'express';
import { ImageController } from '../../controllers/images/images.js';

export const createImageRouter = ({ imageModel }) => {
    const imageRouter = Router();
    const imageController = new ImageController({ imageModel });

    // 🔹 Obtener todas las imágenes de un proyecto
    imageRouter.get('/project/:projectId', imageController.getAllByProject);

    // 🔹 Obtener una imagen por su ID
    imageRouter.get('/:imageId', imageController.getById);

    // 🔹 Crear nueva imagen
    imageRouter.put('/create', imageController.create);

    // 🔹 Actualizar imagen (PATCH)
    imageRouter.patch('/:imageId', imageController.update);

    // 🔹 Eliminar imagen
    imageRouter.delete('/:imageId', imageController.delete);

    return imageRouter;
};
