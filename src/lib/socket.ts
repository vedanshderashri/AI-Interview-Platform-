import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      path: '/api/socketio',
      autoConnect: false,
    });
  }
  return socket;
}
