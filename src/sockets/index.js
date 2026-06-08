const { Server } = require('socket.io');
const { redisSub } = require('../config/redis');
const { registerRoomHandlers } = require('./roomHandler');
const { registerEditorHandlers } = require('./editorHandler');
const { registerCursorHandlers } = require('./cursorHandler');
const logger = require('../utils/logger');

// WebSocket rate limiting: max 50 delta events per second per socket
const DELTA_RATE_LIMIT = 50;
const DELTA_RATE_WINDOW_MS = 1000;

/**
 * Initialize Socket.io server with all event handlers.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Connection Handler ──────────────────────────────────
  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    // Initialize rate limiting state for this socket
    socket.data.deltaCount = 0;
    socket.data.deltaWindowStart = Date.now();

    // Rate limiter middleware for text-delta events
    const originalOnEvent = socket.onevent;
    socket.onevent = function (packet) {
      const eventName = packet.data && packet.data[0];

      if (eventName === 'text-delta') {
        const now = Date.now();

        // Reset window if expired
        if (now - socket.data.deltaWindowStart >= DELTA_RATE_WINDOW_MS) {
          socket.data.deltaCount = 0;
          socket.data.deltaWindowStart = now;
        }

        socket.data.deltaCount++;

        if (socket.data.deltaCount > DELTA_RATE_LIMIT) {
          logger.warn('Socket rate limit exceeded, disconnecting', {
            socketId: socket.id,
            userId: socket.data.user?.id,
            deltaCount: socket.data.deltaCount,
          });
          socket.emit('error', { message: 'Rate limit exceeded' });
          socket.disconnect(true);
          return;
        }
      }

      originalOnEvent.call(socket, packet);
    };

    // Register all event handlers
    registerRoomHandlers(socket, io);
    registerEditorHandlers(socket, io);
    registerCursorHandlers(socket, io);

    socket.on('error', (err) => {
      logger.error('Socket error', { socketId: socket.id, error: err.message });
    });
  });

  // ── Redis Pub/Sub for Multi-Instance Broadcasting ──────
  // Subscribe to room channels dynamically
  const subscribedChannels = new Set();

  /**
   * Subscribe to a room's Redis channel for cross-instance broadcasting.
   * @param {string} roomId
   */
  function subscribeToRoom(roomId) {
    const channel = `room:${roomId}`;
    if (!subscribedChannels.has(channel)) {
      redisSub.subscribe(channel, (err) => {
        if (err) {
          logger.error('Failed to subscribe to Redis channel', { channel, error: err.message });
        } else {
          subscribedChannels.add(channel);
          logger.debug('Subscribed to Redis channel', { channel });
        }
      });
    }
  }

  // Handle messages from Redis pub/sub
  redisSub.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      const roomId = channel.replace('room:', '');

      if (data.type === 'text-delta') {
        // Get all sockets in this room on this instance
        const room = io.sockets.adapter.rooms.get(roomId);
        if (!room) return;

        for (const socketId of room) {
          // Don't send back to the original sender
          if (socketId === data.senderId) continue;

          const targetSocket = io.sockets.sockets.get(socketId);
          if (targetSocket) {
            targetSocket.emit('text-delta', {
              delta: data.delta,
              version: data.version,
              userId: data.userId,
            });
          }
        }
      }
    } catch (err) {
      logger.error('Redis pub/sub message error', { channel, error: err.message });
    }
  });

  // Expose subscribeToRoom for room handlers
  io.subscribeToRoom = subscribeToRoom;

  logger.info('Socket.io server initialized');

  return io;
}

module.exports = { initializeSocket };
