import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const setIO = (io: SocketIOServer): void => {
  ioInstance = io;
};

export const getIO = (): SocketIOServer | null => ioInstance;

const stamp = (payload: Record<string, unknown>) => ({ ...payload, serverTime: new Date().toISOString() });

// Fan-out is room-scoped (admins + the affected users), never io.emit() to every connected socket.
export const emitEvent = (
  event: string,
  payload: Record<string, unknown>,
  userIds: Array<string | null | undefined> = []
): void => {
  if (!ioInstance) return;
  const rooms = ['admins', ...userIds.filter(Boolean).map((id) => `user:${id}`)];
  ioInstance.to(rooms).emit(event, stamp(payload));
};

export const emitToAdmins = (event: string, payload: Record<string, unknown>): void => {
  ioInstance?.to('admins').emit(event, stamp(payload));
};

export const emitToUser = (userId: string, event: string, payload: Record<string, unknown>): void => {
  ioInstance?.to(`user:${userId}`).emit(event, stamp(payload));
};
