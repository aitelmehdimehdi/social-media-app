import { IsString, IsNotEmpty } from 'class-validator';

export class ShareProfileDto {
  @IsString()
  @IsNotEmpty()
  receiverId!: string;
}
