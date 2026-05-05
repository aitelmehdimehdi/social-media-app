import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { Like } from './like.entity';
import { Comment } from './comment.entity';
import { Reel } from './reel.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReelDto } from './dto/create-reel.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Like) private likeRepo: Repository<Like>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Reel) private reelRepo: Repository<Reel>,
    private usersService: UsersService,
  ) {}

  async getFeed(userId: string, page = 1): Promise<object[]> {
    const posts = await this.postRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
      skip: (page - 1) * 10,
    });

    return Promise.all(
      posts.map(async (post) => {
        const isLiked = !!(await this.likeRepo.findOne({
          where: { userId, postId: post.id },
        }));
        return {
          id: post.id,
          username: post.user.username,
          avatar: post.user.avatar,
          location: post.location,
          image: post.imageUrl,
          likes: post.likesCount,
          caption: post.caption,
          comments: post.commentsCount,
          timeAgo: this.timeAgo(post.createdAt),
          isLiked,
          isSaved: false,
        };
      }),
    );
  }

  async createPost(userId: string, dto: CreatePostDto): Promise<Post> {
    const post = this.postRepo.create({ ...dto, userId });
    const saved = await this.postRepo.save(post);
    await this.usersService['userRepo'].increment({ id: userId }, 'postsCount', 1);
    return saved;
  }

  async findByUser(userId: string): Promise<object[]> {
    const posts = await this.postRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return posts.map((post) => ({
      id: post.id,
      image: post.imageUrl,
      type: 'post',
      date: post.createdAt.toISOString(),
    }));
  }

  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; count: number }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.likeRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.likeRepo.remove(existing);
      await this.postRepo.decrement({ id: postId }, 'likesCount', 1);
      return { liked: false, count: post.likesCount - 1 };
    }

    const like = this.likeRepo.create({ userId, postId });
    await this.likeRepo.save(like);
    await this.postRepo.increment({ id: postId }, 'likesCount', 1);
    return { liked: true, count: post.likesCount + 1 };
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto): Promise<Comment> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = this.commentRepo.create({ userId, postId, content: dto.content });
    const saved = await this.commentRepo.save(comment);
    await this.postRepo.increment({ id: postId }, 'commentsCount', 1);
    return saved;
  }

  async getComments(postId: string): Promise<Comment[]> {
    return this.commentRepo.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
  }

  async getReels(userId: string, page = 1): Promise<object[]> {
    const reels = await this.reelRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
      skip: (page - 1) * 10,
    });

    return reels.map((reel) => ({
      id: reel.id,
      username: reel.user.username,
      avatar: reel.user.avatar,
      caption: reel.caption,
      audio: reel.audioTitle ?? '🎵 Original Audio',
      thumbnail: reel.thumbnailUrl,
      likes: reel.likesCount,
      comments: reel.commentsCount,
      shares: reel.sharesCount,
      isLiked: false,
      isSaved: false,
    }));
  }

  async createReel(userId: string, dto: CreateReelDto): Promise<Reel> {
    const reel = this.reelRepo.create({ ...dto, userId });
    return this.reelRepo.save(reel);
  }

  private timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}
