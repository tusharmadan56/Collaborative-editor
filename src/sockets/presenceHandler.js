const { redis } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Add a user to the presence set for a room.
 * @param {string} roomId
 * @param {{ id: string, email: string }} user
 */
async function addUserToRoom(roomId, user) {
  const member = JSON.stringify({ id: user.id, email: user.email });
  await redis.sadd(`presence:${roomId}`, member);
  logger.debug('User added to presence', { roomId, userId: user.id });
}

/**
 * Remove a user from the presence set for a room.
 * @param {string} roomId
 * @param {{ id: string, email: string }} user
 */
async function removeUserFromRoom(roomId, user) {
  const member = JSON.stringify({ id: user.id, email: user.email });
  await redis.srem(`presence:${roomId}`, member);
  logger.debug('User removed from presence', { roomId, userId: user.id });
}

/**
 * Get all online users for a room.
 * @param {string} roomId
 * @returns {Promise<Array<{ id: string, email: string }>>}
 */
async function getOnlineUsers(roomId) {
  const members = await redis.smembers(`presence:${roomId}`);
  return members.map((m) => JSON.parse(m));
}

/**
 * Clean up presence data for a user across all rooms they were in.
 * Called on socket disconnect.
 * @param {string[]} roomIds - List of room IDs the socket was in
 * @param {{ id: string, email: string }} user
 */
async function cleanupPresence(roomIds, user) {
  const pipeline = redis.pipeline();
  const member = JSON.stringify({ id: user.id, email: user.email });

  for (const roomId of roomIds) {
    pipeline.srem(`presence:${roomId}`, member);
  }

  await pipeline.exec();
  logger.debug('Cleaned up presence for disconnected user', {
    userId: user.id,
    roomCount: roomIds.length,
  });
}

module.exports = { addUserToRoom, removeUserFromRoom, getOnlineUsers, cleanupPresence };
