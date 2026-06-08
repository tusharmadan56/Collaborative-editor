const db = require('../../config/db');
const logger = require('../../utils/logger');

/**
 * Create a new room with a blank document.
 * Uses a transaction to ensure atomicity.
 * @param {string} name - Room name
 * @param {string} ownerId - User ID of the room creator
 * @returns {Promise<Object>} Created room
 */
async function createRoom(name, ownerId) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Create room
    const roomResult = await client.query(
      'INSERT INTO rooms (name, owner_id) VALUES ($1, $2) RETURNING id, name, owner_id, created_at',
      [name, ownerId]
    );
    const room = roomResult.rows[0];

    // Add owner as a member
    await client.query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
      [room.id, ownerId]
    );

    // Create blank document for the room
    await client.query(
      'INSERT INTO documents (room_id, content, version) VALUES ($1, $2, $3)',
      [room.id, '', 0]
    );

    await client.query('COMMIT');

    logger.info('Room created', { roomId: room.id, name, ownerId });
    return room;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to create room', { error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get room details by ID, including member count.
 * @param {string} roomId
 * @returns {Promise<Object|null>}
 */
async function getRoomById(roomId) {
  const result = await db.query(
    `SELECT r.id, r.name, r.owner_id, r.created_at,
            (SELECT COUNT(*) FROM room_members rm WHERE rm.room_id = r.id) AS member_count
     FROM rooms r
     WHERE r.id = $1`,
    [roomId]
  );

  return result.rows[0] || null;
}

/**
 * Join a room. If the user is already a member, this is a no-op.
 * @param {string} roomId
 * @param {string} userId
 * @returns {Promise<void>}
 */
async function joinRoom(roomId, userId) {
  // Verify room exists
  const room = await getRoomById(roomId);
  if (!room) {
    const error = new Error('Room not found');
    error.statusCode = 404;
    throw error;
  }

  await db.query(
    'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [roomId, userId]
  );

  logger.info('User joined room', { roomId, userId });
}

/**
 * Get the last N document deltas for a room.
 * @param {string} roomId
 * @param {number} limit
 * @returns {Promise<Object[]>}
 */
async function getRoomHistory(roomId, limit = 50) {
  const result = await db.query(
    `SELECT dh.id, dh.delta, dh.user_id, dh.timestamp, u.email
     FROM document_history dh
     JOIN documents d ON d.id = dh.document_id
     JOIN users u ON u.id = dh.user_id
     WHERE d.room_id = $1
     ORDER BY dh.timestamp DESC
     LIMIT $2`,
    [roomId, limit]
  );

  return result.rows;
}

/**
 * Get all members of a room.
 * @param {string} roomId
 * @returns {Promise<Object[]>}
 */
async function getRoomMembers(roomId) {
  const result = await db.query(
    `SELECT u.id, u.email, rm.joined_at
     FROM room_members rm
     JOIN users u ON u.id = rm.user_id
     WHERE rm.room_id = $1
     ORDER BY rm.joined_at ASC`,
    [roomId]
  );

  return result.rows;
}

module.exports = { createRoom, getRoomById, joinRoom, getRoomHistory, getRoomMembers };
