const winston = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, tenantId, userId, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (tenantId) log += ` [tenant:${tenantId}]`;
  if (userId) log += ` [user:${userId}]`;
  const rest = Object.keys(meta).filter(k => k !== 'service').reduce((a, k) => ({ ...a, [k]: meta[k] }), {});
  if (Object.keys(rest).length > 0) log += ` ${JSON.stringify(rest)}`;
  return log;
});

const logsDir = path.join(process.cwd(), 'logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  defaultMeta: { service: 'saas-backend' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), consoleFormat),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;
