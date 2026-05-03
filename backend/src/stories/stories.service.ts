import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Story } from './story.entity';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private repo: Repository<Story>,
  ) {}

  async create(user: User, imageUrl: string): Promise<Story> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = this.repo.create({ user, imageUrl, expiresAt });
    return this.repo.save(story);
  }

  async findActive(): Promise<Story[]> {
    return this.repo.find({
      where: { expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
  }
}
