import { validateUser, validatePartialUser } from '../../schemas/users.js'
import TokenService from '../../models/token/token.js';
export class UserController {
  constructor({ userModel }) {
    this.userModel = userModel
  }

  getById = async (req, res) => {
    const { id } = req.params
    const user = await this.userModel.getUserById({ id })
    if (user) return res.json(user)
    res.status(404).json({ message: 'User not found' })
  }

  getByUsername = async (req, res) => {
    const { username } = req.params
    const user = await this.userModel.getUserByUsername({ username })
    if (user) return res.json(user)
    res.status(404).json({ message: 'User not found' })
  }

  create = async (req, res) => {
    const result = validateUser(req.body)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    const check_user = await this.userModel.getUserByUsername({ username: result.data.user })

    if (check_user) {
      return res.status(400).json({ message: 'Username already exists' })
    }

    const check_mail = await this.userModel.getUserByMail({ mail: result.data.mail })
    if (check_mail) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newUser = await this.userModel.createUser({ input: result.data })

    if (!newUser) {
      return res.status(400).json({ message: 'Error creating user' })
    }
    res.status(201).json({ message: 'User created successfully' })
  }

  update = async (req, res) => {
    const result = validatePartialUser(req.body)
    console.log('Request Body:', req.body)
    console.log('Validation Result:', result)

    if (!result.success) {
      return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const updatedUser = await this.userModel.updateUser({ id: id, input: result.data })

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    console.log('Updated User:', updatedUser)

    return res.json(updatedUser)
  }

  delete = async (req, res) => {
    const { id } = req.params
    const result = await this.userModel.deleteUser({ id })

    if (!result) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json({ message: 'User deleted' })
  }
  updatePassword = async (req, res) => {
    const { id } = req.params
    const { newPassword } = req.body

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Invalid new password' })
    }

    const result = await this.userModel.updatePassword({ id, newPassword })

    if (!result) {
      return res.status(404).json({ message: 'User not found or password not updated' })
    }

    return res.json({ message: 'Password updated successfully' })
  }
  login = async (req, res) => {

    try {
      const { user, password } = req.body;
      const ObjectUser = await this.userModel.login({ user, password });
      const accessToken = await TokenService.generateAccessToken(ObjectUser);
      const refreshToken = await TokenService.generateRefreshToken(ObjectUser);

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 20 * 24 * 60 * 60 * 1000,
      });
      res.status(200).json({
        user: {
          id: ObjectUser.id,
          user: ObjectUser.user
        }
      });

    } catch (error) {
      res.status(401).json({ mensaje: 'Invalid credentials' });
    }
  }
  logout = async (req, res) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Logged out' });
  }

}
