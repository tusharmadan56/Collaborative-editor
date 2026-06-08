const db = require('../../config/db');
const { redis } = require('../../config/redis');
const logger = require('../../utils/logger');

/**
 * Get the current document state for a room.
 * Tries Redis cache first, falls back to PostgreSQL.
 * @param {string} roomId
 * @returns {Promise<{ content: string, version: number }>}
 */
async function getDocument(roomId) {
  // Try Redis cache first
  const cached = await redis.get(`doc:${roomId}`);
  if (cached) {
    logger.debug('Document loaded from Redis cache', { roomId });
    return JSON.parse(cached);
  }

  // Fallback to PostgreSQL
  const result = await db.query(
    'SELECT id, content, version, updated_at FROM documents WHERE room_id = $1',
    [roomId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Document not found for this room');
    error.statusCode = 404;
    throw error;
  }

  const doc = {
    content: result.rows[0].content,
    version: result.rows[0].version,
  };

  // Warm the Redis cache
  await redis.set(`doc:${roomId}`, JSON.stringify(doc));
  logger.debug('Document loaded from PostgreSQL and cached', { roomId });

  return doc;
}

/**
 * Save the current document snapshot from Redis to PostgreSQL.
 * @param {string} roomId
 * @returns {Promise<{ content: string, version: number }>}
 */
async function saveSnapshot(roomId) {
  const cached = await redis.get(`doc:${roomId}`);

  if (!cached) {
    // Nothing in Redis, read from DB to confirm existence
    const result = await db.query(
      'SELECT id FROM documents WHERE room_id = $1',
      [roomId]
    );
    if (result.rows.length === 0) {
      const error = new Error('Document not found for this room');
      error.statusCode = 404;
      throw error;
    }
    logger.info('No cached document to save, DB already up to date', { roomId });
    return { content: '', version: 0 };
  }

  const { content, version } = JSON.parse(cached);

  await db.query(
    `UPDATE documents
     SET content = $1, version = $2, updated_at = NOW()
     WHERE room_id = $3`,
    [content, version, roomId]
  );

  logger.info('Document snapshot saved to PostgreSQL', { roomId, version });

  return { content, version };
}

module.exports = { getDocument, saveSnapshot };
