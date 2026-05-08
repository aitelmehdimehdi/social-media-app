import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UsersService } from '../users/users.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private chatService: ChatService,
    private usersService: UsersService,
  ) {}

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() userId: string, @ConnectedSocket() client: Socket): void {
    void client.join(userId);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { senderId: string; receiverId: string; content: string },
  ): Promise<void> {
    const [message, sender, receiver] = await Promise.all([
      this.chatService.sendMessage(data.senderId, data.receiverId, data.content),
      this.usersService.findById(data.senderId),
      this.usersService.findById(data.receiverId),
    ]);

    const enriched = {
      ...message,
      sender: { username: sender?.username ?? '', avatar: sender?.avatar ?? null },
    };

    this.server.to(data.senderId).emit('newMessage', enriched);
    this.server.to(data.receiverId).emit('newMessage', enriched);

    // Push notification to receiver if they have a token
    if (receiver?.pushToken) {
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: receiver.pushToken,
          title: sender?.username ?? 'New message',
          body: data.content,
          data: { senderId: data.senderId },
          sound: 'default',
        }),
      }).catch(() => {});
    }
  }
}
