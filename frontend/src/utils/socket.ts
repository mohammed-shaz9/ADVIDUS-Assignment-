import { io, Socket } from 'socket.io-client';

export const createSocket = (baseUrl: string, token: string): Socket => {
  const apiUrl = baseUrl.replace('/api', '');
  return io(apiUrl, {
    path: '/ws',
    transports: ['websocket', 'polling'],
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};
