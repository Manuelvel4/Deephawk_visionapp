import TokenService from '../../models/token/token.js';
export class AuthController {
  static refreshToken = async (req, res) => {
    try {
      const accessToken = req.cookies.access_token;
      const decoded = await TokenService.verifyAccessToken(accessToken);
      if (decoded) {
        return res.status(200).json({
          user: {
            id: decoded.id,
            user: decoded.user
          },
          message: 'Autenticado correctamente_acces'
        });
      }
    } catch {
      console.log('Access token expired or invalid, refreshing...');
    }
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res.status(403).json({ message: 'Refresh token not found' });
    }
    try {
      const decoded = TokenService.verifyRefreshToken(refreshToken);
      const newAccessToken = TokenService.generateAccessToken(decoded);
      console.log('New access token generated:', newAccessToken);
      console.log('Decoded refresh token:', decoded);
      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000,
      });
      if (decoded) {
        console.log(decoded, user)
        return res.status(200).json({
          user: {
            id: decoded.id,
            user: decoded.user
          },
          message: 'Autenticado correctamente'
        });
      }
    } catch {
      return res.status(403).json({ message: 'Refresh token not found' });
    }
  };
}
