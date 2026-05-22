import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

export const config = {
  api: {
    bodyParser: false,
  },
};

let io: Server | null = null;

// Map to store socket.id to user name mapping
const socketToUser: Map<string, { name: string; code: string }> = new Map();

export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      // Join a meeting room
      socket.on('join-room', ({ code, name }) => {
        // Get existing users in this room
        const roomSockets = io!.sockets.adapter.rooms.get(code);
        const existingUsers: { name: string; id: string }[] = [];
        
        if (roomSockets) {
          for (const socketId of roomSockets) {
            const user = socketToUser.get(socketId);
            if (user && user.code === code) {
              existingUsers.push({ name: user.name, id: socketId });
            }
          }
        }

        socket.join(code);
        socketToUser.set(socket.id, { name, code });
        
        // Send existing participants to the new user
        socket.emit('existing-users', existingUsers);
        
        // Notify others about new user
        socket.to(code).emit('user-joined', { name, id: socket.id });
      });

      // Relay messages/events
      socket.on('meeting-event', ({ code, event, payload }) => {
        socket.to(code).emit('meeting-event', { event, payload, from: socket.id });
      });

      // WebRTC signaling relays - send to specific user
      socket.on('offer', ({ code, to, offer, fromName }) => {
        socket.to(code).emit('offer', { from: fromName, to, offer, fromSocketId: socket.id });
      });
      socket.on('answer', ({ code, to, answer, fromName }) => {
        socket.to(code).emit('answer', { from: fromName, to, answer, fromSocketId: socket.id });
      });
      socket.on('ice-candidate', ({ code, to, candidate, fromName }) => {
        socket.to(code).emit('ice-candidate', { from: fromName, to, candidate, fromSocketId: socket.id });
      });

      // Leave
      socket.on('leave-room', ({ code, name }) => {
        socket.leave(code);
        socketToUser.delete(socket.id);
        socket.to(code).emit('user-left', { name, id: socket.id });
      });

      // Cleanup on disconnect
      socket.on('disconnect', () => {
        socketToUser.delete(socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}
