const { getQueue, QUEUES } = require('../config/bullmq');
const logger = require('../utils/logger');

class EmailService {
  async sendEmail(to, subject, html, text) {
    try {
      const queue = getQueue(QUEUES.EMAIL);
      await queue.add('send-email', { to, subject, html, text });
      logger.info('Email queued', { to, subject });
    } catch (err) {
      logger.error('Failed to queue email', { to, subject, error: err.message });
    }
  }

  sendInvitation({ to, tenantName, inviteToken, role }) {
    const url = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
    return this.sendEmail(
      to,
      `You're invited to join ${tenantName}`,
      `<h1>You've been invited to ${tenantName}</h1>
       <p>You've been invited as a <strong>${role}</strong>.</p>
       <a href="${url}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Accept Invitation</a>
       <p>Expires in 7 days.</p>`,
      `Accept your invitation to ${tenantName}: ${url}`
    );
  }

  sendWelcome({ to, firstName, tenantName }) {
    return this.sendEmail(
      to,
      `Welcome to ${tenantName}!`,
      `<h1>Welcome, ${firstName}!</h1><p>Your account is ready. <a href="${process.env.FRONTEND_URL}">Go to Dashboard</a></p>`,
      `Welcome to ${tenantName}, ${firstName}! ${process.env.FRONTEND_URL}`
    );
  }
}

module.exports = new EmailService();
