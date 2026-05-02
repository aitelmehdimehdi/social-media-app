import { IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
