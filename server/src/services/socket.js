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
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('collaborator:joined', { userId: socket.userId });
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('collaborator:left', { userId: socket.userId });
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
  });
}

module.exports = attachSocket;