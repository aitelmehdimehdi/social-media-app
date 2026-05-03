import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { StoriesService } from './stories.service';

@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body('imageUrl') imageUrl: string) {
    return this.storiesService.create(user, imageUrl);
  }

  @Get()
  findActive() {
    return this.storiesService.findActive();
  }
}
