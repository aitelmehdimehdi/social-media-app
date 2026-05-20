import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class MediaService {
  constructor(private config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey    = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    console.log('[MediaService] Cloudinary config —',
      'cloud_name:', cloudName ?? 'MISSING',
      '| api_key:', apiKey ? `${apiKey.slice(0, 6)}…` : 'MISSING',
      '| api_secret:', apiSecret ? '***set***' : 'MISSING',
    );
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  }

  async uploadFile(buffer: Buffer, mimetype: string): Promise<string> {
    console.log('ENV CHECK:', {
      cloud: process.env.CLOUDINARY_CLOUD_NAME,
      key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
    });
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'sharely', resource_type: 'auto' },
        (error, result) => {
          if (error || !result) {
            console.error('[MediaService] uploadFile error:', error);
            return reject(error ?? new Error('No result from Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );
      Readable.from(buffer).pipe(upload);
    });
  }

  async uploadPostImage(buffer: Buffer): Promise<string> {
    console.log('ENV CHECK:', {
      cloud: process.env.CLOUDINARY_CLOUD_NAME,
      key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
    });
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
          if (error || !result) {
            console.error('[MediaService] uploadPostImage error:', error);
            return reject(error ?? new Error('No result from Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );
      Readable.from(buffer).pipe(upload);
    });
  }

  async uploadReelVideo(buffer: Buffer): Promise<string> {
    console.log('ENV CHECK:', {
      cloud: process.env.CLOUDINARY_CLOUD_NAME,
      key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
    });
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'sharely/reels',
          resource_type: 'video',
        },
        (error, result) => {
          if (error || !result) {
            console.error('[MediaService] uploadReelVideo error:', error);
            return reject(error ?? new Error('No result from Cloudinary'));
          }
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
          if (error || !result) {
            console.error('[MediaService] uploadProfilePicture error:', error);
            return reject(error ?? new Error('No result from Cloudinary'));
          }
          resolve(result.secure_url);
        },
      );
      Readable.from(buffer).pipe(upload);
    });
  }
}
