const { Queue } = require('bullmq');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse Redis URL for BullMQ connection options
const url = new URL(redisUrl);
const connection = {
  host: url.hostname,
  port: parseInt(url.port, 10) || 6379,
};

/**
 * Queue for persisting document snapshots to PostgreSQL.
 * Jobs are enqueued every N deltas or on a timer to avoid
 * hammering the database on every keystroke.
 */
const persistQueue = new Queue('persist-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

persistQueue.on('error', (err) => {
  logger.error('BullMQ persist-queue error', { error: err.message });
});

logger.info('BullMQ persist-queue initialized');

module.exports = { persistQueue };
