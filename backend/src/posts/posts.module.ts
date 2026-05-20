import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { UsersModule } from '../users/users.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Like, LikeReel, Comment, CommentLike, SavedPost, SavedReel, Reel, Follow, Message]),
    forwardRef(() => UsersModule),
    MediaModule,
    NotificationsModule,
  ],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
