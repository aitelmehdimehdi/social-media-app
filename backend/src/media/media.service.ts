import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaService {
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}
