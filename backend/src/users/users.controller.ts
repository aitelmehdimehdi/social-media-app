import { BadRequestException, Body, Controller, Delete, forwardRef, Get, Inject, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from '../media/media.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ShareProfileDto } from './dto/share-profile.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { PostsService } from '../posts/posts.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private mediaService: MediaService,
    @Inject(forwardRef(() => PostsService)) private postsService: PostsService,
  ) {}

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const url = await this.mediaService.uploadProfilePicture(file.buffer);
    return this.usersService.updateAvatar(user.id, url);
  }

  @Delete('me/avatar')
  removeAvatar(@CurrentUser() user: User) {
    return this.usersService.removeAvatar(user.id);
  }

  @Patch('me/push-token')
  savePushToken(@CurrentUser() user: User, @Body('token') token: string) {
    return this.usersService.savePushToken(user.id, token);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('me/password')
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Get('search')
  searchUsers(@Query('q') q: string, @CurrentUser() user: User) {
    return this.usersService.searchUsers(q ?? '', user.id);
  }

  // Must be before :id/profile to avoid route collision
  @Post('share-profile/:username')
  shareProfile(
    @Param('username') username: string,
    @CurrentUser() user: User,
    @Body() dto: ShareProfileDto,
  ): Promise<{ sent: boolean }> {
    return this.usersService.shareProfile(user.id, username, dto.receiverId);
  }

  @Get('by-username/:username')
  getProfileByUsername(@Param('username') username: string, @CurrentUser() user: User) {
    return this.usersService.getProfileByUsername(username, user.id);
  }

  @Get(':id/profile')
  getProfile(@Param('id') id: string, @CurrentUser() user: User) {
    return this.usersService.getProfile(id, user.id);
  }

  @Post(':id/follow')
  async follow(@Param('id') id: string, @CurrentUser() user: User) {
    await this.usersService.follow(user.id, id);
    this.postsService.invalidateFeedCache(user.id);
  }

  @Delete(':id/follow')
  async unfollow(@Param('id') id: string, @CurrentUser() user: User) {
    await this.usersService.unfollow(user.id, id);
    this.postsService.invalidateFeedCache(user.id);
  }

  @Delete(':id/follower')
  removeFollower(@Param('id') id: string, @CurrentUser() user: User) {
    return this.usersService.unfollow(id, user.id);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(id);
  }

  @Get(':id/following')
  getFollowing(@Param('id') id: string) {
    return this.usersService.getFollowing(id);
  }
}
