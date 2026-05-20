import { BadRequestException, Controller, InternalServerErrorException, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file received — field name must be "file"');
    try {
      const url = await this.mediaService.uploadFile(file.buffer, file.mimetype);
      return { url };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MediaController] upload error:', msg);
      throw new InternalServerErrorException(msg);
    }
  }

  @Post('post')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadPost(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file received — field name must be "file"');
    try {
      const url = await this.mediaService.uploadPostImage(file.buffer);
      return { url };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MediaController] uploadPost error:', msg);
      throw new InternalServerErrorException(msg);
    }
  }

  @Post('reel')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
    }),
  )
  async uploadReel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file received — field name must be "file"');
    try {
      const url = await this.mediaService.uploadReelVideo(file.buffer);
      return { url };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[MediaController] uploadReel error:', msg);
      throw new InternalServerErrorException(msg);
    }
  }
}
