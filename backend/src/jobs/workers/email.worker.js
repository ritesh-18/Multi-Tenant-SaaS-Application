const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const { connection } = require('../../config/bullmq');
const logger = require('../../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, subject, html, text } = job.data;
    logger.info('Sending email', { jobId: job.id, to, subject });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@saas.com',
      to,
      subject,
      html,
      text,
    });

    logger.info('Email sent', { jobId: job.id, to });
    return { sent: true, to };
  },
  { connection, concurrency: 5 }
);

emailWorker.on('failed', (job, err) => {
  logger.error('Email job failed', { jobId: job?.id, error: err.message });
});

module.exports = emailWorker;
