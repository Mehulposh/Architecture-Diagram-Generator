const jwt = require('jsonwebtoken');

function attachSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Missing auth token'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('Invalid auth token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('project:join', (projectId) => {
      const room = `project:${projectId}`;
      socket.join(room);

      // Tell the newly-joined client who is already in the room, since
      // "collaborator:joined" below only reaches people already present.
      const roomSockets = io.sockets.adapter.rooms.get(room) || new Set();
      const onlineUserIds = [...roomSockets]
        .filter((socketId) => socketId !== socket.id)
        .map((socketId) => io.sockets.sockets.get(socketId)?.userId)
        .filter(Boolean);
      socket.emit('presence:sync', { userIds: [...new Set(onlineUserIds)] });

      socket.to(room).emit('collaborator:joined', { userId: socket.userId });
    });

    socket.on('project:leave', (projectId) => {
      const room = `project:${projectId}`;
      socket.leave(room);
      socket.to(room).emit('collaborator:left', { userId: socket.userId });
    });

    // Broadcast incremental diagram changes (node move, add, edit, connect) to
    // everyone else editing the same project.
    socket.on('diagram:update', ({ projectId, patch }) => {
      socket.to(`project:${projectId}`).emit('diagram:update', { patch, userId: socket.userId });
    });

    socket.on('cursor:move', ({ projectId, position }) => {
      socket.to(`project:${projectId}`).emit('cursor:move', { userId: socket.userId, position });
    });

    socket.on('comment:add', ({ projectId, comment }) => {
      socket.to(`project:${projectId}`).emit('comment:add', { comment, userId: socket.userId });
    });

    // Covers tab close / network drop, where the client never gets to emit
    // "project:leave" explicitly. Socket.IO removes the socket from its rooms
    // automatically; we just need to tell the rest of each room it's gone.
    socket.on('disconnect', () => {
      for (const room of socket.rooms) {
        if (room.startsWith('project:')) {
          socket.to(room).emit('collaborator:left', { userId: socket.userId });
        }
      }
    });
  });
}

module.exports = attachSocket;