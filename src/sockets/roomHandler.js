const { verifyToken } = require('../middleware/auth');
const { redis } = require('../config/redis');
const documentsService = require('../modules/documents/documents.service');
const presence = require('./presenceHandler');
const logger = require('../utils/logger');

/**
 * Register room join/leave handlers for a socket.
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
function registerRoomHandlers(socket, io) {
  // Track which rooms this socket has joined (for cleanup on disconnect)
  socket.data.rooms = new Set();

  /**
   * "join-room" — Authenticate and join a collaborative room.
   * Payload: { roomId, token }
   */
  socket.on('join-room', async (data) => {
    try {
      const { roomId, token } = data;

      if (!roomId || !token) {
        socket.emit('auth-error', { message: 'roomId and token are required' });
        return;
      }

      // Verify JWT
      let user;
      try {
        user = verifyToken(token);
      } catch (err) {
        socket.emit('auth-error', { message: 'Invalid or expired token' });
        logger.warn('Socket auth failed', { socketId: socket.id, error: err.message });
        return;
      }

      // Attach user to socket
      socket.data.user = { id: user.id, email: user.email };

      // Join the Socket.io room
      socket.join(roomId);
      socket.data.rooms.add(roomId);

      // Add to presence
      await presence.addUserToRoom(roomId, socket.data.user);

      // Get online users
      const users = await presence.getOnlineUsers(roomId);

      // Get current document state
      let document;
      try {
        document = await documentsService.getDocument(roomId);
      } catch (err) {
        document = { content: '', version: 0 };
      }

      // Emit room-joined to the joining client
      socket.emit('room-joined', {
        users,
        document,
      });

      // Broadcast user-joined to other clients in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.data.user.id,
        email: socket.data.user.email,
      });

      logger.info('User joined room via socket', {
        userId: socket.data.user.id,
        roomId,
        socketId: socket.id,
      });
    } catch (err) {
      logger.error('Join room socket error', { error: err.message, socketId: socket.id });
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  /**
   * "leave-room" — Leave a collaborative room.
   * Payload: { roomId }
   */
  socket.on('leave-room', async (data) => {
    try {
      const { roomId } = data;

      if (!roomId || !socket.data.user) return;

      socket.leave(roomId);
      socket.data.rooms.delete(roomId);

      await presence.removeUserFromRoom(roomId, socket.data.user);

      socket.to(roomId).emit('user-left', {
        userId: socket.data.user.id,
      });

      logger.info('User left room via socket', {
        userId: socket.data.user.id,
        roomId,
        socketId: socket.id,
      });
    } catch (err) {
      logger.error('Leave room socket error', { error: err.message, socketId: socket.id });
    }
  });

  /**
   * Handle disconnect — clean up all rooms.
   */
  socket.on('disconnect', async (reason) => {
    try {
      const user = socket.data.user;
      const rooms = socket.data.rooms;

      if (!user || !rooms || rooms.size === 0) return;

      const roomIds = Array.from(rooms);

      // Remove from presence in all rooms
      await presence.cleanupPresence(roomIds, user);

      // Broadcast user-left to all rooms
      for (const roomId of roomIds) {
        socket.to(roomId).emit('user-left', { userId: user.id });
      }

      logger.info('Socket disconnected, cleaned up rooms', {
        userId: user.id,
        socketId: socket.id,
        rooms: roomIds,
        reason,
      });
    } catch (err) {
      logger.error('Disconnect cleanup error', { error: err.message, socketId: socket.id });
    }
  });
}

module.exports = { registerRoomHandlers };
