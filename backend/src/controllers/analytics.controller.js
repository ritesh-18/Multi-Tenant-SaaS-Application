const analyticsService = require('../services/analytics.service');
const ApiResponse = require('../utils/response');

class AnalyticsController {
  async getDashboard(req, res, next) {
    try { return ApiResponse.success(res, await analyticsService.getDashboardMetrics(req.tenant.id)); }
    catch (err) { next(err); }
  }
  async getApiUsage(req, res, next) {
    try { return ApiResponse.success(res, await analyticsService.getApiUsageOverTime(req.tenant.id, +(req.query.days || 30))); }
    catch (err) { next(err); }
  }
  async getTopEndpoints(req, res, next) {
    try { return ApiResponse.success(res, await analyticsService.getTopEndpoints(req.tenant.id, +(req.query.limit || 10))); }
    catch (err) { next(err); }
  }
  async getUserActivity(req, res, next) {
    try { return ApiResponse.success(res, await analyticsService.getUserActivity(req.tenant.id, +(req.query.days || 30))); }
    catch (err) { next(err); }
  }
}

module.exports = new AnalyticsController();
