import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export default class TokenService {

  static async generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, user: user.user, mail: user.mail },
      process.env.SECRET_JWT_KEY,
      { expiresIn: '15m' }
    );
  }

  static async generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, user: user.user, mail: user.mail },
      process.env.SECRET_JWT_KEY_REFRESH,
      { expiresIn: '20d' }
    );
  }

  static async verifyAccessToken(token) {
    if (!token) {
      return null;
    }
    return jwt.verify(token, process.env.SECRET_JWT_KEY);
  }

  static async verifyRefreshToken(token) {
    if (!token) {
      return null;
    }
    return jwt.verify(token, process.env.SECRET_JWT_KEY_REFRESH);
  }
}
