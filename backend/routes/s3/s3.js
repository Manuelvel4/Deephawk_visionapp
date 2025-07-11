import { Router } from 'express';
import multer from 'multer';
import { S3Controller } from '../../controllers/s3/s3.js';

const upload = multer(); // Buffer en memoria

export const createS3Router = ({ S3Model }) => {
    const s3Router = Router();
    const s3Controller = new S3Controller({ S3Model });

    // Subida de archivo: se espera un campo 'file' (tipo multipart/form-data)
    s3Router.put('/upload', upload.single('file'), s3Controller.upload);
    // Eliminación de archivo por key (URL relativa)
    s3Router.delete('/:key', s3Controller.delete);
    // Subida de archivo desde ruta local
    s3Router.post('/upload/from-path', s3Controller.uploadFromPath);

    return s3Router;
};