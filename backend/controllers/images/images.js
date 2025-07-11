
export class ImageController {
    constructor({ imageModel }) {
        this.imageModel = imageModel;
    }

    // 🔹 GET: Todas las imágenes de un proyecto
    getAllByProject = async (req, res) => {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        const images = await this.imageModel.getAllByProject({ projectId });
        res.json(images);
    };

    // 🔹 PUT: Crear una nueva imagen
    create = async (req, res) => {
        const { projectId, name, url, metadata } = req.body;

        if (!projectId || !name || !url) {
            return res.status(400).json({ message: 'projectId, name, and url are required' });
        }

        const existingImages = await this.imageModel.getAllByProject({ projectId });
        const nameExists = existingImages.some(image => image.name === name);

        if (nameExists) {
            return res.status(400).json({ message: 'Image name already exists in this project' });
        }

        const result = await this.imageModel.createImage({
            input: { projectId, name, url, metadata }
        });

        if (result.result === 'success') {
            return res.status(201).json({ message: 'Image created', id: result.id });
        }

        return res.status(500).json({ message: 'Error creating image' });
    };

    // 🔹 GET: Obtener imagen por ID
    getById = async (req, res) => {
        const { imageId } = req.params;

        if (!imageId) {
            return res.status(400).json({ message: 'Image ID is required' });
        }

        const image = await this.imageModel.getByImageId({ imageId });

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.json(image);
    };

    // 🔹 PATCH: Actualizar datos de la imagen
    update = async (req, res) => {
        const { imageId } = req.params;
        const updates = req.body;

        if (!imageId) {
            return res.status(400).json({ message: 'Image ID is required' });
        }

        const success = await this.imageModel.updateImage({ imageId, updates });

        if (!success) {
            return res.status(404).json({ message: 'Image not updated' });
        }

        res.json({ message: 'Image updated successfully' });
    };

    // 🔹 DELETE: Eliminar imagen por ID
    delete = async (req, res) => {
        const { imageId } = req.params;

        if (!imageId) {
            return res.status(400).json({ message: 'Image ID is required' });
        }

        const success = await this.imageModel.deleteImage({ imageId });

        if (!success) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.json({ message: 'Image deleted' });
    };
}
