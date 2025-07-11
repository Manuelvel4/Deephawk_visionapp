// Description: Rutas para la gestión de archivos en S3

export class S3Controller {
    constructor({ S3Model }) {
        this.s3Model = S3Model;
    }

    // 🔹 PUT: Subir archivo a S3 y devolver URL
    upload = async (req, res) => {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            const url = await this.s3Model.uploadFileToS3(file.buffer, file.originalname, file.mimetype);
            return res.status(201).json({ message: 'File uploaded to S3', url });
        } catch (error) {
            console.error('S3 upload error:', error);
            return res.status(500).json({ message: 'Error uploading file to S3' });
        }
    };

    // 🔹 DELETE: Eliminar archivo en S3 por clave (key)
    delete = async (req, res) => {
        const { key } = req.params;

        if (!key) {
            return res.status(400).json({ message: 'Key is required' });
        }

        try {
            await this.s3Model.deleteFileFromS3(key);
            return res.json({ message: 'File deleted from S3' });
        } catch (error) {
            console.error('S3 delete error:', error);
            return res.status(500).json({ message: 'Error deleting file from S3' });
        }
    };
    // 🔹 PUT: Subir archivo local a S3 y eliminarlo
    uploadFromPath = async (req, res) => {
        const { localPath, s3Key } = req.body;

        if (!localPath) {
            return res.status(400).json({ message: 'Local path is required' });
        }

        try {
            const url = await this.s3Model.uploadFileFromPath(localPath, s3Key);
            return res.status(201).json({ message: 'Local file uploaded to S3', url });
        } catch (error) {
            console.error('S3 uploadFromPath error:', error);
            return res.status(500).json({ message: 'Error uploading local file to S3' });
        }
    };
}
