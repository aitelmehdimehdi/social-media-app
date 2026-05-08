import { IsString, IsOptional } from 'class-validator';

export class CreateReelDto {
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  audioTitle?: string;
}
