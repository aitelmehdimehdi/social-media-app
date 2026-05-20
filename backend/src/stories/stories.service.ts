import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Story } from './story.entity';

interface CreateStoryDto {
  imageUrl: string;
  overlays?: object[] | null;
  filter?: string | null;
  audioUrl?: string | null;
  location?: string | null;
}

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private repo: Repository<Story>,
  ) {}

  async create(user: User, dto: CreateStoryDto): Promise<Story> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = this.repo.create({
      user,
      imageUrl: dto.imageUrl,
      overlays: dto.overlays ?? null,
      filter: dto.filter ?? null,
      audioUrl: dto.audioUrl ?? null,
      location: dto.location ?? null,
      expiresAt,
    });
    try {
      return await this.repo.save(story);
    } catch (err) {
      console.error('[StoriesService] create() failed:', err);
      throw err;
    }
  }

  async findActive(): Promise<Story[]> {
    return this.repo.find({
      where: { expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
  }
}
