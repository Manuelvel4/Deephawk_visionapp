import { Router } from 'express';
import { LabelController } from '../../controllers/labels/labels.js';

export const createLabelRouter = ({ labelModel }) => {
    const labelRouter = Router();
    const labelController = new LabelController({ labelModel });

    // 🔹 Obtener todas las etiquetas de una imagen
    labelRouter.get('/image/:imageId', labelController.getAllByImage);

    // 🔹 Obtener etiqueta por su ID
    labelRouter.get('/:labelId', labelController.getById);

    // 🔹 Crear nueva etiqueta
    labelRouter.put('/create', labelController.create);

    // 🔹 Actualizar etiqueta
    labelRouter.patch('/:labelId', labelController.update);

    // 🔹 Eliminar etiqueta
    labelRouter.delete('/:labelId', labelController.delete);

    return labelRouter;
};
