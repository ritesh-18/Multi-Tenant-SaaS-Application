const featureFlagService = require('../services/feature-flag.service');
const ApiResponse = require('../utils/response');

class FeatureFlagController {
  async getAll(req, res, next) {
    try { return ApiResponse.success(res, await featureFlagService.getFlags(req.tenant.id)); }
    catch (err) { next(err); }
  }
  async update(req, res, next) {
    try {
      const flag = await featureFlagService.updateFlag(req.tenant.id, req.params.key, req.body.enabled, req.body.config);
      return ApiResponse.success(res, flag, 'Feature flag updated');
    } catch (err) { next(err); }
  }
  async bulkUpdate(req, res, next) {
    try {
      const flags = await featureFlagService.bulkUpdateFlags(req.tenant.id, req.body.updates);
      return ApiResponse.success(res, flags, 'Feature flags updated');
    } catch (err) { next(err); }
  }
}

module.exports = new FeatureFlagController();
