require('dotenv').config();
const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { createQueue, QUEUES } = require('./config/bullmq');
const logger = require('./utils/logger');

if (process.env.START_WORKERS !== 'false') {
  require('./jobs/workers/email.worker');
}

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDatabase();
  await connectRedis();
  Object.values(QUEUES).forEach(createQueue);

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV });
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} — shutting down gracefully`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
