const { Router } = require('express');
const { authMiddleware } = require('../../middleware/auth');
const roomsController = require('./rooms.controller');

const router = Router();

// POST /api/rooms — Create room (auth required)
router.post('/', authMiddleware, roomsController.createRoom);

// GET /api/rooms/:id — Get room details
router.get('/:id', roomsController.getRoom);

// POST /api/rooms/:id/join — Join room (auth required)
router.post('/:id/join', authMiddleware, roomsController.joinRoom);

// GET /api/rooms/:id/history — Get last 50 deltas (auth required)
router.get('/:id/history', authMiddleware, roomsController.getRoomHistory);

module.exports = router;
