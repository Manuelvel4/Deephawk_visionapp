import { Router } from 'express'
import { UserController } from '../../controllers/users/users.js'

export const createUserRouter = ({ userModel }) => {
  const usersRouter = Router()
  const userController = new UserController({ userModel })

  // Crear un nuevo usuario
  usersRouter.post('/create', userController.create)
  // Obtener usuario por ID
  usersRouter.get('/:id', userController.getById)

  // Obtener usuario por nombre de usuario
  usersRouter.get('/username/:username', userController.getByUsername)

  // Actualizar parcialmente un usuario //
  usersRouter.patch('/:id', userController.update)

  // Eliminar un usuario
  usersRouter.delete('/:id', userController.delete)

  // Actualizar solo la contraseña
  usersRouter.patch('/:id/password', userController.updatePassword)
  // login
  usersRouter.post('/login', userController.login)
  // logout
  usersRouter.post('/logout', userController.logout)

  return usersRouter
}
