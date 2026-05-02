import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message) private messageRepo: Repository<Message>,
  ) {}

  async getConversations(userId: string): Promise<object[]> {
    const messages = await this.messageRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .leftJoinAndSelect('msg.receiver', 'receiver')
      .where('msg.senderId = :userId OR msg.receiverId = :userId', { userId })
      .orderBy('msg.createdAt', 'DESC')
      .getMany();

    const seen = new Set<string>();
    const conversations: object[] = [];

    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (seen.has(otherId)) continue;
      seen.add(otherId);

      const other = msg.senderId === userId ? msg.receiver : msg.sender;
      const unread = await this.messageRepo.count({
        where: { senderId: otherId, receiverId: userId, isRead: false },
      });

      conversations.push({
        id: other.id,
        username: other.username,
        avatar: other.avatar,
        lastMessage: msg.content,
        time: this.timeAgo(msg.createdAt),
        unread,
        online: false,
      });
    }

    return conversations;
  }

  async getMessages(userId: string, otherId: string): Promise<Message[]> {
    return this.messageRepo
      .createQueryBuilder('msg')
      .where(
        '(msg.senderId = :userId AND msg.receiverId = :otherId) OR (msg.senderId = :otherId AND msg.receiverId = :userId)',
        { userId, otherId },
      )
      .orderBy('msg.createdAt', 'ASC')
      .getMany();
  }

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const message = this.messageRepo.create({ senderId, receiverId, content });
    return this.messageRepo.save(message);
  }

  async markAsRead(senderId: string, receiverId: string): Promise<void> {
    await this.messageRepo.update({ senderId, receiverId, isRead: false }, { isRead: true });
  }

  private timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }
}
