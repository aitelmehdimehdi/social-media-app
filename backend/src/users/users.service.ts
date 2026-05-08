import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { Message } from '../chat/message.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Follow) private followRepo: Repository<Follow>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
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
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const sensitiveChange = dto.username !== undefined || dto.email !== undefined;
    if (sensitiveChange) {
      if (!dto.currentPassword)
        throw new UnauthorizedException('Current password is required to change username or email');
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) throw new UnauthorizedException('Incorrect password');
    }

    if (dto.username && dto.username !== user.username) {
      const taken = await this.findByUsername(dto.username);
      if (taken) throw new ConflictException('Username already taken');
    }
    if (dto.email && dto.email !== user.email) {
      const taken = await this.findByEmail(dto.email);
      if (taken) throw new ConflictException('Email already in use');
    }

    const { currentPassword: _cp, ...updateData } = dto;
    await this.userRepo.update(id, updateData);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Incorrect current password');
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.update(id, { password: hashed });
    return { message: 'Password updated successfully' };
  }

  async updateAvatar(id: string, url: string): Promise<User> {
    await this.userRepo.update(id, { avatar: url });
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async removeAvatar(id: string): Promise<User> {
    await this.userRepo.update(id, { avatar: null });
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

  // ── Search users by username or fullName (ILIKE) ───────────────────────────

  async searchUsers(
    query: string,
    currentUserId: string,
  ): Promise<object[]> {
    if (!query.trim()) return [];

    const results = await this.userRepo
      .createQueryBuilder('u')
      .where('u.username ILIKE :q OR u."fullName" ILIKE :q', {
        q: `%${query.trim()}%`,
      })
      .andWhere('u.id != :self', { self: currentUserId })
      .select([
        'u.id',
        'u.username',
        'u.fullName',
        'u.avatar',
        'u.followersCount',
      ])
      .take(20)
      .getMany();

    if (results.length === 0) return [];

    const followedRows = await this.followRepo.find({
      where: {
        followerId: currentUserId,
        followingId: In(results.map((u) => u.id)),
      },
      select: ['followingId'],
    });
    const followedSet = new Set(followedRows.map((f) => f.followingId));

    return results.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      avatar: u.avatar,
      followersCount: u.followersCount,
      isFollowing: followedSet.has(u.id),
    }));
  }

  // ── Follow / unfollow ──────────────────────────────────────────────────────

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

  async shareProfile(
    senderId: string,
    profileUsername: string,
    receiverId: string,
  ): Promise<{ sent: boolean }> {
    const profile = await this.userRepo.findOne({ where: { username: profileUsername } });
    if (!profile) throw new NotFoundException('User not found');

    const content = `__SHARED_PROFILE__${JSON.stringify({
      username: profile.username,
      fullName: profile.fullName,
      avatar: profile.avatar,
    })}`;

    await this.messageRepo.save(
      this.messageRepo.create({ senderId, receiverId, content }),
    );
    return { sent: true };
  }
}
