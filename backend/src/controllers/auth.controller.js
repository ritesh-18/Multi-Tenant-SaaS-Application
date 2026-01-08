const keycloakService = require('../services/keycloak.service');
const config = require('../config/keycloak');

class AuthController {
  //   login(req, res) {
  //     const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;

  //     const loginUrl =
  //       `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/auth` +
  //       `?client_id=${config.clientId}` +
  //       `&response_type=code` +
  //       `&scope=openid email profile` +
  //       `&redirect_uri=${encodeURIComponent(redirectUri)}`+
  //       `&kc_idp_hint=google`;

  //     res.redirect(loginUrl);
  //   }

  login(req, res) {
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;

    const googleLoginUrl =
      `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/auth` +
      `?client_id=${config.clientId}` +
      `&response_type=code` +
      `&scope=openid email profile` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&kc_idp_hint=google`;

    res.redirect(googleLoginUrl);
  }
  async loginwithPassword(req, res){
    try {
          const {email , password} = req.body;
          console.log(email , password);
          const token = await keycloakService.loginWithPassword(email, password);
          res.cookie('access_token', token.access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
          });
          res.cookie('refresh_token', token.refresh_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
          });
          // const frontendUrl =
          //   `http://localhost:5173/auth/success` +
          //   `?accessToken=${token.access_token}` +
          //   `&refreshToken=${token.refresh_token}`;
          // res.redirect(frontendUrl);
        res.status(200).json({
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          expiresIn: token.expires_in,
        });

      
    } catch (error) {
      if(error.response?.status === 401){
        res.status(401).json({
          message: 'Invalid email or password',
        });
      }
      res.status(500).json({
        message: 'Something went wrong',
      });
      
    }
  }
  async callback(req, res, next) {
    try {
      const { code } = req.query;
      const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;

      const token = await keycloakService.exchangeCodeForToken(code, redirectUri);

      // here we need to redirect to the frontend and also store token in the cookie
      res.cookie('access_token', token.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

      res.cookie('refresh_token', token.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

      const frontendUrl =
        `http://localhost:5173/auth/success` +
        `?accessToken=${token.access_token}` +
        `&refreshToken=${token.refresh_token}`;

      res.redirect(frontendUrl);
      //   res.json({
      //     accessToken: token.access_token,
      //     refreshToken: token.refresh_token,
      //     expiresIn: token.expires_in,
      //   });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const token = await keycloakService.refreshToken(refreshToken);
      res.json(token);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
