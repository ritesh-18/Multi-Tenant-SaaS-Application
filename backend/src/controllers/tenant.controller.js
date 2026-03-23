const tenantService = require('../services/tenant.service');
const ApiResponse = require('../utils/response');

class TenantController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, status, plan } = req.query;
      const { tenants, total } = await tenantService.getAllTenants({ page: +page, limit: +limit, status, plan });
      return ApiResponse.paginated(res, tenants, total, page, limit);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      return ApiResponse.success(res, await tenantService.getTenantById(req.params.id));
    } catch (err) { next(err); }
  }

  async getCurrent(req, res, next) {
    try {
      return ApiResponse.success(res, req.tenant);
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const tenant = await tenantService.createTenant(req.body);
      return ApiResponse.created(res, tenant, 'Tenant created successfully');
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const tenant = await tenantService.updateTenant(req.params.id, req.body);
      return ApiResponse.success(res, tenant, 'Tenant updated successfully');
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      await tenantService.deleteTenant(req.params.id);
      return ApiResponse.success(res, null, 'Tenant deleted');
    } catch (err) { next(err); }
  }

  async getStats(req, res, next) {
    try {
      const tenantId = req.tenant?.id || req.params.id;
      return ApiResponse.success(res, await tenantService.getTenantStats(tenantId));
    } catch (err) { next(err); }
  }
}

module.exports = new TenantController();
