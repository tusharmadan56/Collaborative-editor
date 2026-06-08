const winston = require('winston');

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Custom log format for development — human-readable.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    if (stack) {
      return `${timestamp} ${level}: ${message}\n${stack}${metaStr}`;
    }
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

/**
 * Production format — structured JSON for log aggregation.
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: 'collab-editor' },
  transports: [
    new winston.transports.Console(),
  ],
});

module.exports = logger;
