const Room = require('../models/Room');
const CodeSession = require('../models/CodeSession');
const Message = require('../models/Message');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, AppError } = require('../utils/helpers');
const logger = require('../config/logger');

// POST /api/rooms/create
const createRoom = asyncHandler(async (req, res) => {
  const { name, language } = req.body;
  const roomId = uuidv4();

  const room = await Room.create({
    roomId,
    name: name || 'Untitled Room',
    language: language || 'javascript',
    owner: req.user.id,
    participants: [{ userId: req.user.id, name: req.user.name }],
  });

  // Create associated code session
  await CodeSession.create({
    roomId,
    language: language || 'javascript',
    lastEditedBy: req.user.id,
  });

  // Track room in user's joined rooms
  await User.findByIdAndUpdate(req.user.id, {
    $push: { roomsJoined: { roomId } },
  });

  logger.info('Room created', { roomId, owner: req.user.id });

  res.status(201).json({
    message: 'Room created',
    room: { roomId: room.roomId, name: room.name, language: room.language },
  });
});

// POST /api/rooms/join
const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.body;

  if (!roomId) throw new AppError('Room ID is required', 400);

  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError('Room not found', 404);

  // Add participant if not already present
  const alreadyJoined = room.participants.some(
    (p) => p.userId?.toString() === req.user.id
  );
  if (!alreadyJoined) {
    room.participants.push({ userId: req.user.id, name: req.user.name });
    await room.save();

    // Track in user's history
    const user = await User.findById(req.user.id);
    const alreadyTracked = user.roomsJoined.some((r) => r.roomId === roomId);
    if (!alreadyTracked) {
      user.roomsJoined.push({ roomId });
      await user.save();
    }
  }

  // Fetch code session and recent messages
  const session = await CodeSession.findOne({ roomId });
  const messages = await Message.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  res.json({
    message: 'Joined room',
    room: {
      roomId: room.roomId,
      name: room.name,
      language: room.language,
      owner: room.owner,
    },
    session: session
      ? { code: session.code, language: session.language }
      : null,
    messages: messages.reverse(),
  });
});

// GET /api/rooms/my-rooms
const getMyRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({
    'participants.userId': req.user.id,
  })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  res.json({
    rooms: rooms.map((r) => ({
      roomId: r.roomId,
      name: r.name,
      language: r.language,
      participantCount: r.participants.length,
      isOwner: r.owner.toString() === req.user.id,
      updatedAt: r.updatedAt,
      createdAt: r.createdAt,
    })),
  });
});

// GET /api/rooms/:roomId
const getRoomDetails = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ roomId: req.params.roomId }).populate(
    'owner',
    'name email'
  );
  if (!room) throw new AppError('Room not found', 404);

  const session = await CodeSession.findOne({ roomId: req.params.roomId });

  res.json({
    room: {
      roomId: room.roomId,
      name: room.name,
      language: room.language,
      owner: room.owner,
      participants: room.participants,
      createdAt: room.createdAt,
    },
    session: session
      ? { code: session.code, language: session.language }
      : null,
  });
});

module.exports = { createRoom, joinRoom, getMyRooms, getRoomDetails };
