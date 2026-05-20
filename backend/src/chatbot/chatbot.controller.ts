import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @Post('message')
  async message(@Body() dto: ChatMessageDto): Promise<{ reply: string }> {
    const reply = await this.chatbotService.chat(dto.message, dto.history);
    return { reply };
  }
}
