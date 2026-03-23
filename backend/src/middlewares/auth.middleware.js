const jwksRsa = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const keycloakConfig = require('../config/keycloak');
const userRepository = require('../repositories/user.repository');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

const jwksClient = jwksRsa({
  jwksUri: `${keycloakConfig.baseUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
  cacheMaxEntries: 5,
  cacheMaxAge: 600_000,
});

function getKey(header, callback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return ApiResponse.unauthorized(res, 'Bearer token required');
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      logger.warn('JWT verification failed', { error: err.message });
      if (err.name === 'TokenExpiredError') return ApiResponse.unauthorized(res, 'Token expired');
      return ApiResponse.unauthorized(res, 'Invalid token');
    }
    req.user = decoded;
    next();
  });
}

async function loadDbUser(req, res, next) {
  try {
    if (!req.user) return ApiResponse.unauthorized(res);

    let dbUser = await userRepository.findByKeycloakId(req.user.sub);

    if (!dbUser && req.tenant) {
      const count = await userRepository.countByTenant(req.tenant.id);
      dbUser = await userRepository.create({
        tenantId: req.tenant.id,
        keycloakId: req.user.sub,
        email: req.user.email,
        firstName: req.user.given_name,
        lastName: req.user.family_name,
        role: count === 0 ? 'ADMIN' : 'USER',
      });
      logger.info('User auto-provisioned', { userId: dbUser.id, tenantId: req.tenant.id });
    }

    if (!dbUser) {
      return ApiResponse.unauthorized(res, 'User not registered. Complete onboarding first.');
    }

    await userRepository.updateLastLogin(dbUser.id);
    req.dbUser = dbUser;
    next();
  } catch (error) {
    logger.error('loadDbUser error', { error: error.message });
    next(error);
  }
}

module.exports = { authenticate, loadDbUser };
