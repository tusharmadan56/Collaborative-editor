const { Worker } = require('bullmq');
const { redis } = require('../config/redis');
const db = require('../config/db');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const url = new URL(redisUrl);
const connection = {
  host: url.hostname,
  port: parseInt(url.port, 10) || 6379,
};

/**
 * Persist worker — picks up jobs from persist-queue and saves
 * the current document snapshot from Redis into PostgreSQL.
 */
const persistWorker = new Worker(
  'persist-queue',
  async (job) => {
    const { roomId } = job.data;
    logger.info('Persist worker processing job', { roomId, jobId: job.id });

    try {
      // Read current document state from Redis
      const docKey = `doc:${roomId}`;
      const docData = await redis.get(docKey);

      if (!docData) {
        logger.warn('No document found in Redis for room', { roomId });
        return;
      }

      const { content, version } = JSON.parse(docData);

      // Upsert the document snapshot into PostgreSQL
      await db.query(
        `UPDATE documents
         SET content = $1, version = $2, updated_at = NOW()
         WHERE room_id = $3`,
        [content, version, roomId]
      );

      logger.info('Document snapshot persisted to PostgreSQL', {
        roomId,
        version,
        contentLength: content.length,
      });
    } catch (err) {
      logger.error('Persist worker failed', { roomId, error: err.message });
      throw err; // Let BullMQ retry
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

persistWorker.on('completed', (job) => {
  logger.debug('Persist job completed', { jobId: job.id, roomId: job.data.roomId });
});

persistWorker.on('failed', (job, err) => {
  logger.error('Persist job failed', {
    jobId: job?.id,
    roomId: job?.data?.roomId,
    error: err.message,
  });
});

module.exports = { persistWorker };
