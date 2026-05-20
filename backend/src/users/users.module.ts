import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { Message } from '../chat/message.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MediaModule } from '../media/media.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow, Message]), MediaModule, forwardRef(() => PostsModule)],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
