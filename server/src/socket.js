let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Q-Flow socket: ${socket.id}`);

    // Join specific queue room if requested
    socket.on('join_queue', (queueId) => {
      socket.join(`queue_${queueId}`);
      console.log(`Client ${socket.id} joined room queue_${queueId}`);
    });

    socket.on('leave_queue', (queueId) => {
      socket.leave(`queue_${queueId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

function broadcastQueueUpdate(eventPayload) {
  if (!ioInstance) return;

  try {
    // Broadcast globally to all manager views and public displays
    ioInstance.emit('queue_update', eventPayload);

    // If queueId is specified, also emit targeted event
    if (eventPayload.queueId) {
      ioInstance.to(`queue_${eventPayload.queueId}`).emit('queue_specific_update', eventPayload);
    }
  } catch (err) {
    console.error('Socket broadcast error:', err);
  }
}

module.exports = {
  initSocket,
  broadcastQueueUpdate
};
