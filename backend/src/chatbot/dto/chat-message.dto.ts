import { IsArray, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoryItem {
  @IsString()
  role!: 'user' | 'assistant';

  @IsString()
  content!: string;
}

export class ChatMessageDto {
  @IsString()
  message!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryItem)
  history!: HistoryItem[];
}
