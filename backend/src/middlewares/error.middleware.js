const logger = require('../utils/logger');
const ApiResponse = require('../utils/response');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    tenantId: req.tenant?.id,
    userId: req.dbUser?.id,
  });

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const detail = err.detail || '';
    const field = detail.match(/\(([^)]+)\)/)?.[1] || 'field';
    return ApiResponse.conflict(res, `${field} already exists`);
  }
  // PostgreSQL foreign key violation
  if (err.code === '23503') return ApiResponse.badRequest(res, 'Referenced record does not exist');
  // PostgreSQL not null violation
  if (err.code === '23502') return ApiResponse.badRequest(res, `Missing required field: ${err.column}`);

  if (err.name === 'JsonWebTokenError') return ApiResponse.unauthorized(res, 'Invalid token');
  if (err.name === 'TokenExpiredError') return ApiResponse.unauthorized(res, 'Token expired');
  if (err.name === 'ValidationError')   return ApiResponse.badRequest(res, err.message, err.details);

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error' : err.message;

  return ApiResponse.error(res, message, statusCode);
}

function notFoundHandler(req, res) {
  return ApiResponse.notFound(res, `Route ${req.method} ${req.path} not found`);
}

module.exports = { errorHandler, notFoundHandler };
