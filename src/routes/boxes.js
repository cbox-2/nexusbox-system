const express = require('express');
const router = express.Router();
const boxController = require('../controllers/boxController');
const authMiddleware = require('../middleware/auth');
const { apiRateLimit } = require('../middleware/security-routes');

// All routes require authentication
router.use(authMiddleware);

// Box CRUD
router.post('/', apiRateLimit(60000, 10), boxController.createBox);
router.get('/', boxController.getMyBoxes);
router.get('/all', authMiddleware.adminCheck, boxController.getAllBoxes);
router.get('/:id', boxController.getBox);
router.get('/:id/stats', boxController.getBoxStats);
router.put('/:id', apiRateLimit(60000, 30), boxController.updateBox);
router.delete('/:id', apiRateLimit(60000, 10), boxController.deleteBox);

module.exports = router;
