import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class MediaService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.get<string>('CLOUDINARY_API_KEY'),
      api_secret: config.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(buffer: Buffer, mimetype: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'sharely', resource_type: 'auto' },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        },
      );
      const stream = Readable.from(buffer);
      stream.pipe(upload);
    });
  }

  async uploadPostImage(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'sharely/posts',
          resource_type: 'image',
          transformation: [
            { width: 1080, height: 1080, crop: 'limit' },
            { fetch_format: 'auto', quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        },
      );
      Readable.from(buffer).pipe(upload);
    });
  }

  async uploadReelVideo(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'sharely/reels',
          resource_type: 'video',
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        },
      );
      Readable.from(buffer).pipe(upload);
    });
  }

  async deleteAsset(url: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
    if (!match) return;
    await cloudinary.uploader.destroy(match[1], { resource_type: resourceType });
  }

  async uploadProfilePicture(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'sharely/profile-pictures',
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { fetch_format: 'auto', quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        },
      );
      const stream = Readable.from(buffer);
      stream.pipe(upload);
    });
  }
}
