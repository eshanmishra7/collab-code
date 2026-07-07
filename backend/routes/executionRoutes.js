const express = require('express');
const router = express.Router();
const { runCode, getHistory } = require('../controllers/executionController');
const authMiddleware = require('../middleware/authMiddleware');
const { executionLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);

router.post('/', executionLimiter, runCode);
router.get('/history', getHistory);

module.exports = router;
