import { io } from 'socket.io-client';

/**
 * Socket client helpers for real-time collaboration and event communication.
 * Provides connection, access, and disconnect utilities for the shared socket instance.
 */
let socket = null;

/**
 * Connects to the shared socket server using the provided authentication token.
 * Reuses an existing active connection when available.
 *
 * @param {string} token - Authentication token used for socket connection.
 * @returns {Object} The active socket instance.
 */
export function connectSocket(token) {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io('/', {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socket;
}

/**
 * Returns the currently initialized socket instance.
 *
 * @returns {Object|null} The shared socket instance, or null if not connected.
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnects the current socket instance and clears the shared reference.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}