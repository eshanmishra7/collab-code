const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getMyRooms, getRoomDetails } = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/my-rooms', getMyRooms);
router.get('/:roomId', getRoomDetails);

module.exports = router;
