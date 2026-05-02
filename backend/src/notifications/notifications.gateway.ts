import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/notifications' })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() userId: string, @ConnectedSocket() client: Socket): void {
    void client.join(userId);
  }

  sendNotification(userId: string, payload: object): void {
    this.server.to(userId).emit('notification', payload);
  }
}
