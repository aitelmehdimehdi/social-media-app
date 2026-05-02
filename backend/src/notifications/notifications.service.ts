import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  async getAll(userId: string): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }

  async create(
    recipientId: string,
    senderId: string,
    type: NotificationType,
    postId?: string,
  ): Promise<Notification> {
    const notif = this.notifRepo.create({ recipientId, senderId, type, postId });
    return this.notifRepo.save(notif);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notifRepo.update({ recipientId: userId, isRead: false }, { isRead: true });
  }
}
