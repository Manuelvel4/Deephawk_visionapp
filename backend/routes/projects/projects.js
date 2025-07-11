import { Router } from 'express'
import { ProjectController } from '../../controllers/project/project.js'

export const createProjectRouter = ({ projectModel }) => {
    const projectRouter = Router()
    const projectController = new ProjectController({ projectModel })
    projectRouter.get('/user/:userId', projectController.getAll)
    projectRouter.get('/:projectId', projectController.getById)
    projectRouter.put('/create', projectController.create)
    projectRouter.delete('/:projectId', projectController.delete)
    projectRouter.patch('/:projectId', projectController.update)
    return projectRouter
}
