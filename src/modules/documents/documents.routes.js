const { Router } = require('express');
const { authMiddleware } = require('../../middleware/auth');
const documentsController = require('./documents.controller');

const router = Router();

// GET /api/documents/:roomId — Get current document state (auth required)
router.get('/:roomId', authMiddleware, documentsController.getDocument);

// POST /api/documents/:roomId/save — Manually save snapshot (auth required)
router.post('/:roomId/save', authMiddleware, documentsController.saveSnapshot);

module.exports = router;
