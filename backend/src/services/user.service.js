const userRepository = require('../repositories/user.repository');
const { query, transaction } = require('../config/database');
const emailService = require('./email.service');
const logger = require('../utils/logger');

class UserService {
  async getUsers(tenantId, filters) {
    return userRepository.findAll({ tenantId, ...filters });
  }

  async getUserById(id, tenantId) {
    const user = await userRepository.findById(id, tenantId);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }

  async updateUser(id, tenantId, data) {
    await this.getUserById(id, tenantId);
    return userRepository.update(id, tenantId, data);
  }

  async deleteUser(id, tenantId, requestingUserId) {
    if (id === requestingUserId) throw Object.assign(new Error('Cannot deactivate your own account'), { statusCode: 400 });
    await this.getUserById(id, tenantId);
    return userRepository.deactivate(id, tenantId);
  }

  async inviteUser(tenantId, email, role, invitedByUserId) {
    const existing = await userRepository.findByEmail(email, tenantId);
    if (existing) throw Object.assign(new Error('User already exists in this tenant'), { statusCode: 409 });

    const { rows: [tenant] } = await query(`SELECT name, max_users FROM tenants WHERE id = $1`, [tenantId]);
    const userCount = await userRepository.countByTenant(tenantId);
    if (userCount >= tenant.max_users) {
      throw Object.assign(new Error(`User limit reached (${tenant.max_users}). Upgrade your plan.`), { statusCode: 403 });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const { rows: [invitation] } = await query(`
      INSERT INTO invitations (tenant_id, email, role, expires_at)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [tenantId, email, role, expiresAt]);

    await emailService.sendInvitation({ to: email, tenantName: tenant.name, inviteToken: invitation.token, role });
    logger.info('Invitation sent', { tenantId, email, role, invitedByUserId });
    return invitation;
  }

  async acceptInvitation(token, keycloakUser) {
    const { rows: [invitation] } = await query(`
      SELECT i.*, t.name AS tenant_name FROM invitations i
      JOIN tenants t ON t.id = i.tenant_id
      WHERE i.token = $1
    `, [token]);

    if (!invitation) throw Object.assign(new Error('Invalid invitation token'), { statusCode: 400 });
    if (invitation.accepted_at) throw Object.assign(new Error('Invitation already used'), { statusCode: 400 });
    if (invitation.expires_at < new Date()) throw Object.assign(new Error('Invitation expired'), { statusCode: 400 });

    return transaction(async (client) => {
      const { rows: [user] } = await client.query(`
        INSERT INTO users (tenant_id, keycloak_id, email, first_name, last_name, role, last_login_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *
      `, [invitation.tenant_id, keycloakUser.sub, invitation.email,
          keycloakUser.given_name, keycloakUser.family_name, invitation.role]);

      await client.query(`UPDATE invitations SET accepted_at = NOW() WHERE id = $1`, [invitation.id]);
      logger.info('Invitation accepted', { userId: user.id, tenantId: invitation.tenant_id });
      return user;
    });
  }

  async getNotifications(userId, tenantId) {
    const { rows } = await query(`
      SELECT * FROM notifications WHERE user_id = $1 AND tenant_id = $2
      ORDER BY created_at DESC LIMIT 50
    `, [userId, tenantId]);
    return rows;
  }

  async markNotificationRead(notificationId, userId) {
    await query(`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`, [notificationId, userId]);
  }
}

module.exports = new UserService();
