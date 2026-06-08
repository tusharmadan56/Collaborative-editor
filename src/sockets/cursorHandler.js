const logger = require('../utils/logger');

/**
 * Register cursor event handlers for a socket.
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
function registerCursorHandlers(socket, io) {
  /**
   * "cursor-move" — Broadcast cursor position to other users in the room.
   * Payload: { roomId, position: { line, ch }, userId }
   */
  socket.on('cursor-move', (data) => {
    try {
      const { roomId, position } = data;
      const user = socket.data.user;

      if (!roomId || !position) {
        return;
      }

      // Broadcast to everyone in the room except the sender
      socket.to(roomId).emit('cursor-update', {
        userId: user.id,
        email: user.email,
        position,
      });
    } catch (err) {
      logger.error('Cursor move error', { error: err.message, socketId: socket.id });
    }
  });
}

module.exports = { registerCursorHandlers };
