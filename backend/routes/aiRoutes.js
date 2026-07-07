const express = require('express');
const router = express.Router();
const { explain, bugfix, optimize, complexity, autocomplete, hints, chat } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(authMiddleware);
router.use(aiLimiter);

router.post('/explain', explain);
router.post('/bugfix', bugfix);
router.post('/optimize', optimize);
router.post('/complexity', complexity);
router.post('/autocomplete', autocomplete);
router.post('/interview-hints', hints);
router.post('/chat', chat);

module.exports = router;

