
export class ProjectController {
    constructor({ projectModel }) {
        this.projectModel = projectModel
    }

    // 🔹 GET: Todos los proyectos del usuario autenticado
    getAll = async (req, res) => {
        const { userId } = req.params
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' })
        }

        const projects = await this.projectModel.getAll({ userId })
        res.json(projects)
    }

    // 🔹 PUT: Crear un nuevo proyecto (nombre único por usuario)
    create = async (req, res) => {
        const { userId, name, description, modelo, modelodescrip, img } = req.body

        if (!userId || !name) {
            return res.status(400).json({ message: 'userId and name are required' })
        }

        // Verifica que el proyecto con ese nombre no exista ya para el usuario
        const existingProjects = await this.projectModel.getAll({ userId })
        const nameExists = existingProjects.some(p => p.name === name)

        if (nameExists) {
            return res.status(400).json({ message: 'Project name already exists for this user' })
        }

        const result = await this.projectModel.createProject({
            input: { userId, name, description, modelo, modelodescrip, img }
        })

        if (result.result === 'success') {
            return res.status(201).json({ message: 'Project created', id: result.id })
        }

        return res.status(500).json({ message: 'Error creating project' })
    }

    // 🔹 DELETE: Borrar proyecto por ID
    delete = async (req, res) => {
        const { projectId } = req.params

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' })
        }

        const success = await this.projectModel.deleteProject({ projectId })

        if (!success) {
            return res.status(404).json({ message: 'Project not found' })
        }

        res.json({ message: 'Project deleted' })
    }

    // 🔹 PATCH: Actualizar campos de un proyecto
    update = async (req, res) => {
        const { projectId } = req.params
        const updates = req.body

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' })
        }

        const success = await this.projectModel.updateProject({ projectId, updates })

        if (!success) {
            return res.status(404).json({ message: 'Project not found or not updated' })
        }

        res.json({ message: 'Project updated successfully' })
    }

    // 🔹 GET: Obtener proyecto por ID
    getById = async (req, res) => {
        const { projectId } = req.params

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' })
        }

        const project = await this.projectModel.getById({ projectId })

        if (!project) {
            return res.status(404).json({ message: 'Project not found' })
        }

        res.json(project)
    }
}
