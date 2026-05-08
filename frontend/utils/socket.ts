import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config/env';

let chatSocket: Socket | null = null;
let notifSocket: Socket | null = null;

export function getSocket(userId: string): Socket {
  if (chatSocket?.connected) return chatSocket;
  const base = API_URL.replace('/api', '');
  chatSocket = io(`${base}/chat`, { transports: ['websocket'] });
  chatSocket.on('connect', () => {
    chatSocket!.emit('joinRoom', userId);
  });
  return chatSocket;
}

export function getNotifSocket(userId: string): Socket {
  if (notifSocket?.connected) return notifSocket;
  const base = API_URL.replace('/api', '');
  notifSocket = io(`${base}/notifications`, { transports: ['websocket'] });
  notifSocket.on('connect', () => {
    notifSocket!.emit('subscribe', userId);
  });
  return notifSocket;
}

export function disconnectSocket(): void {
  chatSocket?.disconnect();
  chatSocket = null;
  notifSocket?.disconnect();
  notifSocket = null;
}
