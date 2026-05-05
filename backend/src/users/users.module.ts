import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Follow } from './follow.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow]), MediaModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
