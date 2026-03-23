const subscriptionService = require('../services/subscription.service');
const ApiResponse = require('../utils/response');

class SubscriptionController {
  async get(req, res, next) {
    try { return ApiResponse.success(res, await subscriptionService.getSubscription(req.tenant.id)); }
    catch (err) { next(err); }
  }
  async upgrade(req, res, next) {
    try {
      const sub = await subscriptionService.upgradePlan(req.tenant.id, req.body.plan);
      return ApiResponse.success(res, sub, `Upgraded to ${req.body.plan}`);
    } catch (err) { next(err); }
  }
  async getPlans(req, res, next) {
    try { return ApiResponse.success(res, subscriptionService.getPlanConfig()); }
    catch (err) { next(err); }
  }
}

module.exports = new SubscriptionController();
