import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const setIO = (io: SocketIOServer): void => {
  ioInstance = io;
};

export const getIO = (): SocketIOServer | null => ioInstance;

export const emitEvent = (event: string, payload: Record<string, unknown>): void => {
  if (!ioInstance) return;
  ioInstance.emit(event, { ...payload, serverTime: new Date().toISOString() });
};

export const emitToAdmins = (event: string, payload: Record<string, unknown>): void => {
  if (!ioInstance) return;
  ioInstance.to('admins').emit(event, { ...payload, serverTime: new Date().toISOString() });
};
