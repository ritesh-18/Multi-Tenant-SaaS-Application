

module.exports = {
  baseUrl: process.env.KEYCLOAK_BASE_URL,
  realm: process.env.KEYCLOAK_REALM,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  issuer: process.env.KEYCLOAK_ISSUER,
};
