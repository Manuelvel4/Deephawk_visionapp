import { Router } from 'express'
import { AuthController } from '../../controllers/auth/token.js'
export const createAuthRouter = () => {
  const authRouter = Router()
  authRouter.post('/', AuthController.refreshToken)
  return authRouter
}
