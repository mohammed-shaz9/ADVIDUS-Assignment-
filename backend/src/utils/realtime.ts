import { Server as SocketIOServer, Socket } from 'socket.io';

let ioInstance: SocketIOServer | null = null;
const userSockets = new Map<string, Set<string>>();

export const setIO = (io: SocketIOServer): void => {
  ioInstance = io;
};

export const getIO = (): SocketIOServer | null => ioInstance;

export const registerUserSocket = (userId: string, socketId: string): void => {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(socketId);
};

export const unregisterUserSocket = (userId: string, socketId: string): void => {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) userSockets.delete(userId);
  }
};

export const emitEvent = (event: string, payload: Record<string, unknown>): void => {
  if (!ioInstance) return;
  ioInstance.emit(event, { ...payload, serverTime: new Date().toISOString() });
};

export const emitToAdmins = (event: string, payload: Record<string, unknown>): void => {
  if (!ioInstance) return;
  ioInstance.to('admins').emit(event, { ...payload, serverTime: new Date().toISOString() });
};

export const emitToUser = (userId: string, event: string, payload: Record<string, unknown>): void => {
  if (!ioInstance) return;
  const sockets = userSockets.get(userId);
  if (sockets) {
    for (const socketId of sockets) {
      ioInstance.to(socketId).emit(event, { ...payload, serverTime: new Date().toISOString() });
    }
  }
};
