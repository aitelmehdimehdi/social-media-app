import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReelDto } from './dto/create-reel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get('feed')
  getFeed(@CurrentUser() user: User, @Query('page') page = '1') {
    return this.postsService.getFeed(user.id, parseInt(page));
  }

  @Post()
  createPost(@CurrentUser() user: User, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(user.id, dto);
  }

  @Post(':id/like')
  toggleLike(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.toggleLike(user.id, id);
  }

  @Get('user/:userId')
  getByUser(@Param('userId') userId: string) {
    return this.postsService.findByUser(userId);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.postsService.getComments(id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(user.id, id, dto);
  }

  @Get('reels')
  getReels(@CurrentUser() user: User, @Query('page') page = '1') {
    return this.postsService.getReels(user.id, parseInt(page));
  }

  @Post('reels')
  createReel(@CurrentUser() user: User, @Body() dto: CreateReelDto) {
    return this.postsService.createReel(user.id, dto);
  }
}
