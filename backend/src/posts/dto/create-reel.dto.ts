import { IsString, IsOptional } from 'class-validator';

export class CreateReelDto {
  @IsString()
  thumbnailUrl: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  audioTitle?: string;
}
