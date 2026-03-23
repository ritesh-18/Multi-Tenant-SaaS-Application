const userService = require('../services/user.service');
const ApiResponse = require('../utils/response');

class UserController {
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 20, role, status } = req.query;
      const { users, total } = await userService.getUsers(req.tenant.id, { page: +page, limit: +limit, role, status });
      return ApiResponse.paginated(res, users, total, page, limit);
    } catch (err) { next(err); }
  }

  async getById(req, res, next) {
    try {
      return ApiResponse.success(res, await userService.getUserById(req.params.id, req.tenant.id));
    } catch (err) { next(err); }
  }

  async getMe(req, res, next) {
    try {
      return ApiResponse.success(res, req.dbUser);
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.tenant.id, req.body);
      return ApiResponse.success(res, user, 'User updated');
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      await userService.deleteUser(req.params.id, req.tenant.id, req.dbUser.id);
      return ApiResponse.success(res, null, 'User deactivated');
    } catch (err) { next(err); }
  }

  async invite(req, res, next) {
    try {
      const { email, role = 'USER' } = req.body;
      const invitation = await userService.inviteUser(req.tenant.id, email, role, req.dbUser.id);
      return ApiResponse.created(res, { id: invitation.id, email }, 'Invitation sent');
    } catch (err) { next(err); }
  }

  async acceptInvite(req, res, next) {
    try {
      const user = await userService.acceptInvitation(req.params.token, req.user);
      return ApiResponse.success(res, user, 'Invitation accepted');
    } catch (err) { next(err); }
  }

  async getNotifications(req, res, next) {
    try {
      const notifications = await userService.getNotifications(req.dbUser.id, req.tenant.id);
      return ApiResponse.success(res, notifications);
    } catch (err) { next(err); }
  }

  async markNotificationRead(req, res, next) {
    try {
      await userService.markNotificationRead(req.params.id, req.dbUser.id);
      return ApiResponse.success(res, null, 'Notification marked as read');
    } catch (err) { next(err); }
  }
}

module.exports = new UserController();
