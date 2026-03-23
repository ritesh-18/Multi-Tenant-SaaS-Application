class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created(res, data, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  static paginated(res, data, total, page, limit, message = 'Success') {
    return this.success(res, data, message, 200, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    });
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static badRequest(res, message = 'Bad Request', errors = null) {
    return this.error(res, message, 400, errors);
  }

  static conflict(res, message = 'Conflict') {
    return this.error(res, message, 409);
  }

  static tooManyRequests(res, message = 'Too many requests. Please slow down.') {
    return this.error(res, message, 429);
  }
}

module.exports = ApiResponse;
