import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Post } from './post.entity';
import { Like } from './like.entity';
import { LikeReel } from './like-reel.entity';
import { Comment } from './comment.entity';
import { CommentLike } from './comment-like.entity';
import { SavedPost } from './saved-post.entity';
import { SavedReel } from './saved-reel.entity';
import { Reel } from './reel.entity';
import { Follow } from '../users/follow.entity';
import { Message } from '../chat/message.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReelDto } from './dto/create-reel.dto';
import { UsersService } from '../users/users.service';

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Keys used:
//   feed:score:{userId}      — scored + sorted Post[] with feedType, TTL 2 min
//   feed:interests:{userId}  — Map<hashtag, count> interest profile, TTL 10 min

interface CacheEntry { data: unknown; expiresAt: number }
const feedCache = new Map<string, CacheEntry>();

function cacheGet<T>(key: string): T | null {
  const entry = feedCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { feedCache.delete(key); return null; }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown, ttlMs = 120_000): void {
  feedCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function cacheInvalidateUser(userId: string): void {
  for (const key of feedCache.keys()) {
    if (key.includes(userId)) feedCache.delete(key);
  }
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface FeedPost {
  id: string;
  username: string;
  avatar: string | null;
  location: string;
  image: string;
  likes: number;
  caption: string;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
  isSaved: boolean;
}

export interface FeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
  feedType: 'following' | 'discover';
}

export interface CommentDto {
  id: string;
  username: string;
  avatar: string | null;
  content: string;
  likes: number;
  isLiked: boolean;
  timeAgo: string;
  parentId: string | null;
  replies: CommentDto[];
}

// ─── Scoring types ────────────────────────────────────────────────────────────

interface PostScore {
  post: Post;
  score: number;
}

interface ScoredFeedCache {
  posts: PostScore[];
  feedType: 'following' | 'discover';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractHashtags(caption: string): string[] {
  return (caption.match(/#\w+/g) ?? []).map((h) => h.toLowerCase());
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)       private postRepo: Repository<Post>,
    @InjectRepository(Like)       private likeRepo: Repository<Like>,
    @InjectRepository(LikeReel)   private likeReelRepo: Repository<LikeReel>,
    @InjectRepository(Comment)    private commentRepo: Repository<Comment>,
    @InjectRepository(CommentLike) private commentLikeRepo: Repository<CommentLike>,
    @InjectRepository(SavedPost)  private savedPostRepo: Repository<SavedPost>,
    @InjectRepository(SavedReel)  private savedReelRepo: Repository<SavedReel>,
    @InjectRepository(Reel)       private reelRepo: Repository<Reel>,
    @InjectRepository(Follow)     private followRepo: Repository<Follow>,
    @InjectRepository(Message)    private messageRepo: Repository<Message>,
    private usersService: UsersService,
  ) {}

  // ── Feed (scoring algorithm + offset cursor) ───────────────────────────────

  async getFeed(userId: string, cursor?: string, limit = 10): Promise<FeedResponse> {
    // cursor is an integer offset into the scored list (e.g. "0", "10", "20")
    const offset = cursor ? parseInt(cursor, 10) : 0;

    const scoreCacheKey = `feed:score:${userId}`;
    let cached = cacheGet<ScoredFeedCache>(scoreCacheKey);

    if (!cached) {
      // ── Build interest profile from user's liked posts ──────────────────
      const interestKey = `feed:interests:${userId}`;
      let interests = cacheGet<Map<string, number>>(interestKey);

      if (!interests) {
        interests = new Map<string, number>();
        const likedRows = await this.likeRepo.find({
          where: { userId },
          relations: ['post'],
        });
        for (const row of likedRows) {
          if (!row.post?.caption) continue;
          for (const tag of extractHashtags(row.post.caption)) {
            interests.set(tag, (interests.get(tag) ?? 0) + 1);
          }
        }
        cacheSet(interestKey, interests, 600_000); // 10 min TTL
      }

      // ── Load following list ─────────────────────────────────────────────
      const followRows = await this.followRepo.find({
        where: { followerId: userId },
        select: ['followingId'],
      });
      const followingSet = new Set(followRows.map((f) => f.followingId));
      const feedType: 'following' | 'discover' =
        followingSet.size === 0 ? 'discover' : 'following';

      // ── Load up to 200 recent candidate posts (excluding own) ───────────
      const candidates = await this.postRepo.find({
        where: { userId: Not(userId) },
        order: { createdAt: 'DESC' },
        take: 200,
      });

      // ── Score each post ─────────────────────────────────────────────────
      const scored: PostScore[] = candidates.map((post) => {
        const hoursOld =
          (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000;

        // Freshness: decays to ~14% after 48 h
        const recencyScore = 100 * Math.exp(-hoursOld / 48);

        // Popularity: composite of likes and comments, capped at 100
        const popularityScore = Math.min(
          100,
          (post.likesCount / 100) * 50 + (post.commentsCount / 20) * 50,
        );

        // Interest: hashtag overlap with user's liked-post history
        const postTags = extractHashtags(post.caption ?? '');
        const matchWeight = postTags.reduce(
          (sum, tag) => sum + (interests!.get(tag) ?? 0),
          0,
        );
        const interestScore = Math.min(100, matchWeight * 20);

        // Following bonus: heavy boost for people the user follows
        const followingBonus = followingSet.has(post.userId) ? 100 : 0;

        const score =
          recencyScore    * 30 +
          popularityScore * 25 +
          interestScore   * 30 +
          followingBonus  * 15;

        return { post, score };
      });

      // Sort descending by score
      scored.sort((a, b) => b.score - a.score);

      cached = { posts: scored, feedType };
      cacheSet(scoreCacheKey, cached, 120_000); // 2 min TTL
    }

    // ── Slice the sorted list using offset cursor ─────────────────────────
    const page = cached.posts.slice(offset, offset + limit + 1);
    const hasMore = page.length > limit;
    if (hasMore) page.pop();

    // ── Batch-load isLiked / isSaved for this page ────────────────────────
    const postIds = page.map((sp) => sp.post.id);
    const [likedRows, savedRows] = await Promise.all([
      postIds.length
        ? this.likeRepo.find({ where: { userId, postId: In(postIds) }, select: ['postId'] })
        : [],
      postIds.length
        ? this.savedPostRepo.find({ where: { userId, postId: In(postIds) }, select: ['postId'] })
        : [],
    ]);
    const likedSet = new Set(likedRows.map((l) => l.postId));
    const savedSet = new Set(savedRows.map((s) => s.postId));

    return {
      posts: page.map(({ post }) => ({
        id:       post.id,
        username: post.user.username,
        avatar:   post.user.avatar ?? '',
        location: post.location ?? '',
        image:    post.imageUrl,
        likes:    post.likesCount,
        caption:  post.caption ?? '',
        comments: post.commentsCount,
        timeAgo:  this.timeAgo(post.createdAt),
        isLiked:  likedSet.has(post.id),
        isSaved:  savedSet.has(post.id),
      })),
      nextCursor: hasMore ? String(offset + limit) : null,
      feedType:   cached.feedType,
    };
  }

  // ── Create post ────────────────────────────────────────────────────────────

  async createPost(userId: string, dto: CreatePostDto): Promise<Post> {
    const post = this.postRepo.create({ ...dto, userId });
    const saved = await this.postRepo.save(post);
    await (this.usersService as unknown as { userRepo: Repository<{ id: string }> })
      .userRepo.increment({ id: userId }, 'postsCount', 1);
    return saved;
  }

  async findByUser(userId: string): Promise<object[]> {
    const posts = await this.postRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return posts.map((post) => ({
      id:   post.id,
      image: post.imageUrl,
      type: 'post',
      date: post.createdAt.toISOString(),
    }));
  }

  // ── Saved & liked collections ──────────────────────────────────────────────

  async getSavedPosts(userId: string): Promise<object[]> {
    const [savedPosts, savedReels] = await Promise.all([
      this.savedPostRepo.find({ where: { userId }, relations: ['post'], order: { createdAt: 'DESC' } }),
      this.savedReelRepo.find({ where: { userId }, relations: ['reel'], order: { createdAt: 'DESC' } }),
    ]);

    const posts = savedPosts
      .filter((s) => !!s.post)
      .map((s) => ({ id: s.post.id, image: s.post.imageUrl, type: 'post' as const, date: s.post.createdAt.toISOString() }));

    const reels = savedReels
      .filter((s) => !!s.reel)
      .map((s) => ({ id: s.reel.id, image: s.reel.thumbnailUrl, type: 'reel' as const, date: s.reel.createdAt.toISOString() }));

    return [...posts, ...reels].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getLikedPosts(userId: string): Promise<object[]> {
    const [likes, reelLikes] = await Promise.all([
      this.likeRepo.find({ where: { userId }, relations: ['post'] }),
      this.likeReelRepo.find({ where: { userId }, relations: ['reel'] }),
    ]);

    const posts = likes
      .filter((l) => !!l.post)
      .map((l) => ({ id: l.post.id, image: l.post.imageUrl, type: 'post' as const, date: l.post.createdAt.toISOString() }));

    const reels = reelLikes
      .filter((l) => !!l.reel)
      .map((l) => ({ id: l.reel.id, image: l.reel.thumbnailUrl, type: 'reel' as const, date: l.reel.createdAt.toISOString() }));

    return [...posts, ...reels].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ── Like / unlike post ─────────────────────────────────────────────────────

  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; count: number }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.likeRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.likeRepo.remove(existing);
      await this.postRepo.decrement({ id: postId }, 'likesCount', 1);
      cacheInvalidateUser(userId);
      return { liked: false, count: post.likesCount - 1 };
    }

    await this.likeRepo.save(this.likeRepo.create({ userId, postId }));
    await this.postRepo.increment({ id: postId }, 'likesCount', 1);
    cacheInvalidateUser(userId);
    return { liked: true, count: post.likesCount + 1 };
  }

  // ── Save / unsave post ─────────────────────────────────────────────────────

  async toggleSave(userId: string, postId: string): Promise<{ saved: boolean }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.savedPostRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.savedPostRepo.remove(existing);
      cacheInvalidateUser(userId);
      return { saved: false };
    }

    await this.savedPostRepo.save(this.savedPostRepo.create({ userId, postId }));
    cacheInvalidateUser(userId);
    return { saved: true };
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  async addComment(
    userId: string,
    postId: string,
    dto: CreateCommentDto & { parentId?: string },
  ): Promise<Comment> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = this.commentRepo.create({
      userId,
      postId,
      content: dto.content,
      ...(dto.parentId ? { parentId: dto.parentId } : { parentId: null }),
    });
    const inserted = await this.commentRepo.save(comment);
    const saved = await this.commentRepo.findOne({ where: { id: inserted.id } });
    if (!saved) throw new NotFoundException('Comment not found after save');

    if (!dto.parentId) {
      await this.postRepo.increment({ id: postId }, 'commentsCount', 1);
    }
    cacheInvalidateUser(userId);
    return saved;
  }

  async getComments(postId: string, userId: string): Promise<CommentDto[]> {
    const all = await this.commentRepo.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });

    const likedSet = new Set(
      (await this.commentLikeRepo.find({ where: { userId } })).map((l) => l.commentId),
    );

    const toDto = (c: Comment, replies: Comment[]): CommentDto => ({
      id:       c.id,
      username: c.user.username,
      avatar:   c.user.avatar ?? '',
      content:  c.content,
      likes:    c.likesCount,
      isLiked:  likedSet.has(c.id),
      timeAgo:  this.timeAgo(c.createdAt),
      parentId: c.parentId,
      replies:  replies.filter((r) => r.parentId === c.id).map((r) => toDto(r, [])),
    });

    const roots   = all.filter((c) => !c.parentId);
    const replies = all.filter((c) => !!c.parentId);
    return roots.map((root) => toDto(root, replies));
  }

  // ── Like / unlike comment ──────────────────────────────────────────────────

  async toggleCommentLike(userId: string, commentId: string): Promise<{ liked: boolean; count: number }> {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.commentLikeRepo.findOne({ where: { userId, commentId } });
    if (existing) {
      await this.commentLikeRepo.remove(existing);
      await this.commentRepo.decrement({ id: commentId }, 'likesCount', 1);
      return { liked: false, count: comment.likesCount - 1 };
    }

    await this.commentLikeRepo.save(this.commentLikeRepo.create({ userId, commentId }));
    await this.commentRepo.increment({ id: commentId }, 'likesCount', 1);
    return { liked: true, count: comment.likesCount + 1 };
  }

  // ── Single resource getters ────────────────────────────────────────────────

  async findPostById(postId: string, currentUserId: string): Promise<object> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const [isLiked, isSaved] = await Promise.all([
      this.likeRepo.findOne({ where: { userId: currentUserId, postId } }),
      this.savedPostRepo.findOne({ where: { userId: currentUserId, postId } }),
    ]);

    return {
      id:       post.id,
      username: post.user.username,
      avatar:   post.user.avatar,
      userId:   post.userId,
      location: post.location,
      image:    post.imageUrl,
      likes:    post.likesCount,
      caption:  post.caption,
      comments: post.commentsCount,
      timeAgo:  this.timeAgo(post.createdAt),
      createdAt: post.createdAt,
      isLiked:  !!isLiked,
      isSaved:  !!isSaved,
    };
  }

  async findReelById(reelId: string, userId: string): Promise<object> {
    const reel = await this.reelRepo.findOne({ where: { id: reelId } });
    if (!reel) throw new NotFoundException('Reel not found');

    const [isLiked, isSaved] = await Promise.all([
      this.likeReelRepo.findOne({ where: { userId, reelId } }),
      this.savedReelRepo.findOne({ where: { userId, reelId } }),
    ]);

    return {
      id:       reel.id,
      username: reel.user.username,
      avatar:   reel.user.avatar,
      userId:   reel.userId,
      caption:  reel.caption,
      audio:    reel.audioTitle ?? '🎵 Original Audio',
      image:    reel.thumbnailUrl,
      likes:    reel.likesCount,
      comments: reel.commentsCount,
      shares:   reel.sharesCount,
      timeAgo:  this.timeAgo(reel.createdAt),
      isLiked:  !!isLiked,
      isSaved:  !!isSaved,
    };
  }

  // ── Reels ──────────────────────────────────────────────────────────────────

  async getReels(userId: string, page = 1): Promise<object[]> {
    const reels = await this.reelRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
      skip: (page - 1) * 10,
    });
    if (reels.length === 0) return [];

    const reelIds = reels.map((r) => r.id);
    const [likedRows, savedRows] = await Promise.all([
      this.likeReelRepo.find({ where: { userId, reelId: In(reelIds) }, select: ['reelId'] }),
      this.savedReelRepo.find({ where: { userId, reelId: In(reelIds) }, select: ['reelId'] }),
    ]);
    const likedSet = new Set(likedRows.map((l) => l.reelId));
    const savedSet = new Set(savedRows.map((s) => s.reelId));

    return reels.map((reel) => ({
      id:       reel.id,
      username: reel.user.username,
      avatar:   reel.user.avatar,
      caption:  reel.caption,
      audio:    reel.audioTitle ?? '🎵 Original Audio',
      thumbnail: reel.thumbnailUrl,
      likes:    reel.likesCount,
      comments: reel.commentsCount,
      shares:   reel.sharesCount,
      isLiked:  likedSet.has(reel.id),
      isSaved:  savedSet.has(reel.id),
    }));
  }

  async createReel(userId: string, dto: CreateReelDto): Promise<Reel> {
    const reel = this.reelRepo.create({ ...dto, userId });
    return this.reelRepo.save(reel);
  }

  // ── Like / unlike reel ─────────────────────────────────────────────────────

  async toggleLikeReel(userId: string, reelId: string): Promise<{ liked: boolean; count: number }> {
    const reel = await this.reelRepo.findOne({ where: { id: reelId } });
    if (!reel) throw new NotFoundException('Reel not found');

    const existing = await this.likeReelRepo.findOne({ where: { userId, reelId } });
    if (existing) {
      await this.likeReelRepo.remove(existing);
      await this.reelRepo.decrement({ id: reelId }, 'likesCount', 1);
      return { liked: false, count: reel.likesCount - 1 };
    }

    await this.likeReelRepo.save(this.likeReelRepo.create({ userId, reelId }));
    await this.reelRepo.increment({ id: reelId }, 'likesCount', 1);
    return { liked: true, count: reel.likesCount + 1 };
  }

  // ── Save / unsave reel ─────────────────────────────────────────────────────

  async toggleSaveReel(userId: string, reelId: string): Promise<{ saved: boolean }> {
    const reel = await this.reelRepo.findOne({ where: { id: reelId } });
    if (!reel) throw new NotFoundException('Reel not found');

    const existing = await this.savedReelRepo.findOne({ where: { userId, reelId } });
    if (existing) {
      await this.savedReelRepo.remove(existing);
      return { saved: false };
    }

    await this.savedReelRepo.save(this.savedReelRepo.create({ userId, reelId }));
    return { saved: true };
  }

  // ── Share post ─────────────────────────────────────────────────────────────

  async sharePost(senderId: string, postId: string, receiverId: string): Promise<{ sent: boolean }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const caption = post.caption
      ? `"${post.caption.slice(0, 80)}${post.caption.length > 80 ? '…' : ''}"`
      : '';
    const content = `__SHARED_POST__${JSON.stringify({
      postId,
      imageUrl: post.imageUrl,
      username: post.user?.username ?? '',
      caption,
    })}`;

    await this.messageRepo.save(this.messageRepo.create({ senderId, receiverId, content }));
    await this.postRepo.increment({ id: postId }, 'sharesCount', 1);
    cacheInvalidateUser(senderId);
    return { sent: true };
  }

  // ── Share suggestions (interaction-scored following list) ──────────────────

  async getShareSuggestions(userId: string): Promise<object[]> {
    const follows = await this.followRepo.find({
      where: { followerId: userId },
      relations: ['following'],
    });

    const scored = await Promise.all(
      follows.map(async (f) => {
        const msgCount = await this.messageRepo
          .createQueryBuilder('m')
          .where(
            '(m.senderId = :a AND m.receiverId = :b) OR (m.senderId = :b AND m.receiverId = :a)',
            { a: userId, b: f.followingId },
          )
          .getCount();

        const mutualFollow = await this.followRepo.findOne({
          where: { followerId: f.followingId, followingId: userId },
        });

        return {
          id:       f.following.id,
          username: f.following.username,
          avatar:   f.following.avatar,
          score:    msgCount * 2 + (mutualFollow ? 3 : 0),
        };
      }),
    );

    return scored.sort((a, b) => b.score - a.score);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private timeAgo(date: Date): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}
