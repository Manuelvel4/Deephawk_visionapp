export class YoloController {
    constructor({ YoloModel }) {
        this.yoloModel = YoloModel;
    }

    // 🔹 GET: Todas las Yolons de un proyecto
    getAllByProject = async (req, res) => {
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }
        const yolos = await this.yoloModel.getAllByProject({ projectId });
        res.json(yolos);
    };

    // 🔹 GET: Todas las Yolons de un usuario
    getByUserId = async (req, res) => {
        const { userId } = req.params;

        console.log('Fetching Yolons for user:', userId);

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const yolos = await this.yoloModel.getByUserId({ userId });
        res.json(yolos);
    };

    // 🔹 GET: Obtener Yolon por su ID
    getById = async (req, res) => {
        const { yoloId } = req.params;

        if (!yoloId) {
            return res.status(400).json({ message: 'Yolo ID is required' });
        }

        const yolo = await this.yoloModel.getByYoloId({ YoloId: yoloId });

        if (!yolo) {
            return res.status(404).json({ message: 'Yolo not found' });
        }

        res.json(yolo);
    };

    // 🔹 PUT: Crear nuevo Yolon
    create = async (req, res) => {
        const input = req.body;

        if (!input.projectId || !input.userId || !input.name || !input.url || !input.model || !input.descripcion) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await this.yoloModel.createYolo({ input });

        if (result.result === 'success') {
            return res.status(201).json({ message: 'Yolo created', id: result.id });
        }

        return res.status(500).json({ message: 'Error creating Yolo' });
    };

    // 🔹 PATCH: Actualizar Yolon (nombre, metadatos, etc.)
    update = async (req, res) => {
        const { yoloId } = req.params;
        const updates = req.body;

        if (!yoloId) {
            return res.status(400).json({ message: 'Yolo ID is required' });
        }

        const success = await this.yoloModel.updateYolo({ YoloId: yoloId, updates });

        if (!success) {
            return res.status(404).json({ message: 'Yolo not found or not updated' });
        }

        res.json({ message: 'Yolo updated successfully' });
    };

    // 🔹 DELETE: Eliminar Yolon
    delete = async (req, res) => {
        const { yoloId } = req.params;

        if (!yoloId) {
            return res.status(400).json({ message: 'Yolo ID is required' });
        }

        const success = await this.yoloModel.deleteYolo({ YoloId: yoloId });

        if (!success) {
            return res.status(404).json({ message: 'Yolo not found' });
        }

        res.json({ message: 'Yolo deleted' });
    };
}
