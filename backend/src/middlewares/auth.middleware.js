const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const config = require('../config/keycloak');

const client = jwksClient({
  jwksUri: `${config.issuer}/protocol/openid-connect/certs`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

module.exports = function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ['RS256'],
      issuer: config.issuer,
    },
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      req.user = decoded;
      next();
    }
  );
};
