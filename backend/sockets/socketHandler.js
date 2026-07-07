const { verifyAccessToken } = require('../services/tokenService');
const CodeSession = require('../models/CodeSession');
const Message = require('../models/Message');
const Room = require('../models/Room');
const { getRandomColor } = require('../utils/helpers');
const logger = require('../config/logger');

// In-memory room state for active connections
const rooms = new Map();

const initializeSocket = (io) => {
  // Socket authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id, userId: socket.user.id });

    // ─── Join Room ──────────────────────────────────────────────────────
    socket.on('join-room', async ({ roomId, userName }) => {
      socket.join(roomId);

      // Initialize room state if needed
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { users: [] });
      }

      const roomState = rooms.get(roomId);

      // Remove duplicate entries for same user
      roomState.users = roomState.users.filter(
        (u) => u.socketId !== socket.id && u.userId !== socket.user.id
      );

      const userEntry = {
        socketId: socket.id,
        userId: socket.user.id,
        name: userName || socket.user.name,
        color: getRandomColor(),
        cursor: null,
      };

      roomState.users.push(userEntry);
      socket.currentRoom = roomId;

      // Send current code to the joining user
      const session = await CodeSession.findOne({ roomId });
      if (session) {
        socket.emit('sync-code', {
          code: session.code,
          language: session.language,
        });
      }

      // Notify all users in the room
      io.to(roomId).emit('user-joined', {
        user: userEntry,
        activeUsers: roomState.users,
        message: `${userEntry.name} joined the room`,
      });

      logger.info('User joined room', { roomId, userName: userEntry.name });
    });

    // ─── Code Change ────────────────────────────────────────────────────
    socket.on('code-change', async ({ roomId, code, language }) => {
      // Broadcast to other users in the room
      socket.to(roomId).emit('code-change', { code, language });

      // Persist to database (debounced at client, so this is reasonable)
      try {
        await CodeSession.findOneAndUpdate(
          { roomId },
          { code, language, lastEditedBy: socket.user.id, $inc: { version: 1 } },
          { upsert: true }
        );
      } catch (err) {
        logger.error('Failed to persist code', { roomId, error: err.message });
      }
    });

    // ─── Language Change ────────────────────────────────────────────────
    socket.on('language-change', async ({ roomId, language }) => {
      socket.to(roomId).emit('language-change', { language });

      try {
        await CodeSession.findOneAndUpdate({ roomId }, { language });
        await Room.findOneAndUpdate({ roomId }, { language });
      } catch (err) {
        logger.error('Failed to update language', { roomId, error: err.message });
      }
    });

    // ─── Cursor Change ──────────────────────────────────────────────────
    socket.on('cursor-move', ({ roomId, position }) => {
      const roomState = rooms.get(roomId);
      if (roomState) {
        const user = roomState.users.find((u) => u.socketId === socket.id);
        if (user) user.cursor = position;
      }

      socket.to(roomId).emit('cursor-change', {
        socketId: socket.id,
        userId: socket.user.id,
        name: socket.user.name,
        position,
      });
    });

    // ─── Chat Messages ──────────────────────────────────────────────────
    socket.on('send-message', async ({ roomId, message, senderName }) => {
      const msg = {
        roomId,
        sender: { userId: socket.user.id, name: senderName || socket.user.name },
        message,
        timestamp: new Date(),
      };

      // Save to database
      try {
        const saved = await Message.create(msg);
        msg._id = saved._id;
      } catch (err) {
        logger.error('Failed to save message', { roomId, error: err.message });
      }

      // Broadcast to entire room including sender
      io.to(roomId).emit('receive-message', msg);
    });

    // ─── Leave Room ─────────────────────────────────────────────────────
    socket.on('leave-room', ({ roomId }) => {
      handleLeaveRoom(socket, roomId, io);
    });

    // ─── Disconnect ─────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (socket.currentRoom) {
        handleLeaveRoom(socket, socket.currentRoom, io);
      }
      logger.info('Socket disconnected', { socketId: socket.id });
    });
  });
};

function handleLeaveRoom(socket, roomId, io) {
  socket.leave(roomId);

  const roomState = rooms.get(roomId);
  if (!roomState) return;

  const leavingUser = roomState.users.find((u) => u.socketId === socket.id);
  roomState.users = roomState.users.filter((u) => u.socketId !== socket.id);

  // Clean up empty rooms from memory
  if (roomState.users.length === 0) {
    rooms.delete(roomId);
  }

  io.to(roomId).emit('user-left', {
    user: leavingUser,
    activeUsers: roomState.users,
    message: `${leavingUser?.name || 'A user'} left the room`,
  });
}

module.exports = initializeSocket;
