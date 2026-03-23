const { Queue } = require('bullmq');
const logger = require('../utils/logger');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const QUEUES = { EMAIL: 'email', REPORTS: 'reports', NOTIFICATIONS: 'notifications' };

const queues = {};

function createQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
    logger.info(`Queue created: ${name}`);
  }
  return queues[name];
}

function getQueue(name) {
  return queues[name] || createQueue(name);
}

module.exports = { createQueue, getQueue, QUEUES, connection };
