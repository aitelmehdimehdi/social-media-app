import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: User) {
    return this.chatService.getConversations(user.id);
  }

  @Get(':userId/messages')
  getMessages(@Param('userId') otherId: string, @CurrentUser() user: User) {
    return this.chatService.getMessages(user.id, otherId);
  }

  @Post('send')
  send(@CurrentUser() user: User, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user.id, dto.receiverId, dto.content);
  }
}
