import { Router } from 'express';
import { YoloController } from '../../controllers/Yolo/yolo.js';

export const createYoloRouter = ({ YoloModel }) => {
    const yoloRouter = Router();
    const yoloController = new YoloController({ YoloModel });

    // 🔹 Obtener todos los Yolons de un proyecto
    yoloRouter.get('/project/:projectId', yoloController.getAllByProject);

    // 🔹 Obtener todos los Yolons de un usuario
    yoloRouter.get('/user/:userId', yoloController.getByUserId);

    // 🔹 Obtener Yolon por su ID
    yoloRouter.get('/:yoloId', yoloController.getById);

    // 🔹 Crear nuevo Yolon
    yoloRouter.put('/create', yoloController.create);

    // 🔹 Actualizar Yolon
    yoloRouter.patch('/:yoloId', yoloController.update);

    // 🔹 Eliminar Yolon
    yoloRouter.delete('/:yoloId', yoloController.delete);

    return yoloRouter;
};
