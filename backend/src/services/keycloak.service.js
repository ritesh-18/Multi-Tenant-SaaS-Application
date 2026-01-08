// // Keycloak service placeholder

// class KeycloakService {
//   constructor() {
//     // Initialize keycloak client or config
//   }

//   async verifyToken(token) {
//     // TODO: Implement token verification with Keycloak
//     return true;
//   }
// }

// module.exports = new KeycloakService();


const axios = require('axios');
const qs = require('qs');
const config = require('../config/keycloak');

class KeycloakService {
  async exchangeCodeForToken(code, redirectUri) {
    const tokenUrl = `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/token`;

    const payload = qs.stringify({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const { data } = await axios.post(tokenUrl, payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return data;
  }

  async refreshToken(refreshToken) {
    const tokenUrl = `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/token`;

    const payload = qs.stringify({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    });

    const { data } = await axios.post(tokenUrl, payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return data;
  }

  async loginWithPassword(email, password) {
    try {
      const KEYCLOAK_TOKEN_URL=`${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/token`;
      const payload = qs.stringify({
        grant_type: 'password',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        username: email,
        password: password,
        scope: 'openid',
      });

      const response = await axios.post(KEYCLOAK_TOKEN_URL, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log("response is " , response)

      return response.data; // access_token, refresh_token, etc.
    } catch (err) {
      console.log(err)
      if (err.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      throw err;
    }
  }
}

module.exports = new KeycloakService();
