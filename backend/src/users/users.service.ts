import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async create(dto: RegisterDto): Promise<User> {
    const emailExists = await this.findByEmail(dto.email);
    if (emailExists) throw new ConflictException('Email already in use');

    const usernameExists = await this.findByUsername(dto.username);
    if (usernameExists) throw new ConflictException('Username already taken');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, password: hashed });
    return this.userRepo.save(user);
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    await this.userRepo.update(id, dto);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async getProfile(targetId: string, currentUserId: string) {
    const user = await this.findById(targetId);
    if (!user) throw new NotFoundException('User not found');

    const isFollowing = await this.followRepo.findOne({
      where: { followerId: currentUserId, followingId: targetId },
    });

    const { password: _pw, ...safeUser } = user as User & { password: string };
    return { ...safeUser, isFollowing: !!isFollowing };
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) return;

    const already = await this.followRepo.findOne({ where: { followerId, followingId } });
    if (already) return;

    const follow = this.followRepo.create({ followerId, followingId });
    await this.followRepo.save(follow);

    await this.userRepo.increment({ id: followingId }, 'followersCount', 1);
    await this.userRepo.increment({ id: followerId }, 'followingCount', 1);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const follow = await this.followRepo.findOne({ where: { followerId, followingId } });
    if (!follow) return;

    await this.followRepo.remove(follow);
    await this.userRepo.decrement({ id: followingId }, 'followersCount', 1);
    await this.userRepo.decrement({ id: followerId }, 'followingCount', 1);
  }

  async getFollowers(userId: string): Promise<object[]> {
    const follows = await this.followRepo.find({
      where: { followingId: userId },
      relations: ['follower'],
    });
    return follows.map((f) => {
      const { password: _pw, ...safe } = f.follower as User & { password: string };
      return safe;
    });
  }

  async getFollowing(userId: string): Promise<object[]> {
    const follows = await this.followRepo.find({
      where: { followerId: userId },
      relations: ['following'],
    });
    return follows.map((f) => {
      const { password: _pw, ...safe } = f.following as User & { password: string };
      return safe;
    });
  }
}
