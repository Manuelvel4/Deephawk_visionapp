export class LabelController {
    constructor({ labelModel }) {
        this.labelModel = labelModel;
    }

    // 🔹 GET: Todas las etiquetas de una imagen
    getAllByImage = async (req, res) => {
        const { imageId } = req.params;

        if (!imageId) {
            return res.status(400).json({ message: 'Image ID is required' });
        }

        const labels = await this.labelModel.getAllByImage({ imageId });
        res.json(labels);
    };

    // 🔹 GET: Etiqueta por ID
    getById = async (req, res) => {
        const { labelId } = req.params;

        if (!labelId) {
            return res.status(400).json({ message: 'Label ID is required' });
        }

        const label = await this.labelModel.getById({ labelId });

        if (!label) {
            return res.status(404).json({ message: 'Label not found' });
        }

        res.json(label);
    };

    // 🔹 PUT: Crear nueva etiqueta (name único por imagen)
    create = async (req, res) => {
        const { imageId, name, coordinates } = req.body;

        if (!imageId || !name || !coordinates || coordinates.length !== 4) {
            return res.status(400).json({
                message: 'imageId, name and coordinates [x, y, w, h] are required',
            });
        }

        const exists = await this.labelModel.existsLabelName({ imageId, name });

        if (exists) {
            return res.status(400).json({ message: 'Label name already exists in this image' });
        }

        const result = await this.labelModel.createLabel({
            input: { imageId, name, coordinates },
        });

        if (result.result === 'success') {
            return res.status(201).json({ message: 'Label created', id: result.id });
        }

        return res.status(500).json({ message: 'Error creating label' });
    };

    // 🔹 PATCH: Actualizar etiqueta
    update = async (req, res) => {
        const { labelId } = req.params;
        const updates = req.body;

        if (!labelId) {
            return res.status(400).json({ message: 'Label ID is required' });
        }

        const success = await this.labelModel.updateLabel({ labelId, updates });

        if (!success) {
            return res.status(404).json({ message: 'Label not found or not updated' });
        }

        res.json({ message: 'Label updated successfully' });
    };

    // 🔹 DELETE: Eliminar etiqueta
    delete = async (req, res) => {
        const { labelId } = req.params;

        if (!labelId) {
            return res.status(400).json({ message: 'Label ID is required' });
        }

        const success = await this.labelModel.deleteLabel({ labelId });

        if (!success) {
            return res.status(404).json({ message: 'Label not found' });
        }

        res.json({ message: 'Label deleted' });
    };
}
