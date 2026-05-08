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
  create(@CurrentUser() user: User, @Body() body: {
    imageUrl: string;
    overlays?: object[] | null;
    filter?: string | null;
    audioUrl?: string | null;
    location?: string | null;
  }) {
    return this.storiesService.create(user, body);
  }

  @Get()
  findActive() {
    return this.storiesService.findActive();
  }
}
