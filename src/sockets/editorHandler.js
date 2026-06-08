const { redis, redisPub } = require('../config/redis');
const db = require('../config/db');
const { apply } = require('../utils/ot');
const { persistQueue } = require('../queues');
const logger = require('../utils/logger');

// Track delta counts per room for batch persistence
const deltaCounters = new Map();

// Track last persist time per room
const lastPersistTime = new Map();

const DELTA_PERSIST_THRESHOLD = 10;
const TIME_PERSIST_THRESHOLD_MS = 30000; // 30 seconds

/**
 * Register editor event handlers for a socket.
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
function registerEditorHandlers(socket, io) {
  /**
   * "text-delta" — Apply a text operation and broadcast to the room.
   * Payload: { roomId, delta, version }
   *
   * delta: { type: 'insert'|'delete'|'retain', position?, text?, length? }
   */
  socket.on('text-delta', async (data) => {
    try {
      const { roomId, delta, version } = data;
      const user = socket.data.user;

      if (!roomId || !delta || version === undefined) {
        socket.emit('error', { message: 'Invalid text-delta payload' });
        return;
      }

      const docKey = `doc:${roomId}`;

      // Get current document state from Redis
      const docData = await redis.get(docKey);
      let doc = docData ? JSON.parse(docData) : { content: '', version: 0 };

      // Version conflict check
      if (version !== doc.version) {
        socket.emit('version-conflict', {
          serverVersion: doc.version,
          clientVersion: version,
        });
        return;
      }

      // Apply the delta to the document
      const newContent = apply(doc.content, delta);
      const newVersion = doc.version + 1;

      // Update Redis
      const updatedDoc = { content: newContent, version: newVersion };
      await redis.set(docKey, JSON.stringify(updatedDoc));

      // Record delta in document_history
      try {
        await db.query(
          `INSERT INTO document_history (document_id, delta, user_id)
           SELECT d.id, $1, $2 FROM documents d WHERE d.room_id = $3`,
          [JSON.stringify(delta), user.id, roomId]
        );
      } catch (histErr) {
        logger.error('Failed to record delta in history', {
          roomId,
          error: histErr.message,
        });
      }

      // Publish to Redis for multi-instance broadcasting
      const message = JSON.stringify({
        type: 'text-delta',
        roomId,
        delta,
        version: newVersion,
        userId: user.id,
        senderId: socket.id,
      });
      await redisPub.publish(`room:${roomId}`, message);

      // Broadcast to other clients on this instance
      socket.to(roomId).emit('text-delta', {
        delta,
        version: newVersion,
        userId: user.id,
      });

      // Batch persistence logic
      const currentCount = (deltaCounters.get(roomId) || 0) + 1;
      deltaCounters.set(roomId, currentCount);

      const lastTime = lastPersistTime.get(roomId) || 0;
      const now = Date.now();

      if (currentCount >= DELTA_PERSIST_THRESHOLD || (now - lastTime) >= TIME_PERSIST_THRESHOLD_MS) {
        // Enqueue persist job
        await persistQueue.add('persist-document', { roomId }, {
          jobId: `persist-${roomId}-${now}`,
          removeOnComplete: true,
        });

        deltaCounters.set(roomId, 0);
        lastPersistTime.set(roomId, now);

        logger.debug('Enqueued persist job', { roomId, deltaCount: currentCount });
      }
    } catch (err) {
      logger.error('Text delta error', {
        error: err.message,
        socketId: socket.id,
      });
      socket.emit('error', { message: 'Failed to process text delta' });
    }
  });
}

module.exports = { registerEditorHandlers };
