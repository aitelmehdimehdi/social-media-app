import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

  async uploadFile(file: Express.Multer.File): Promise<string> {
    console.log('=== UPLOAD START ===');
    console.log('File:', file?.originalname, file?.mimetype, file?.size);
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
    });
    try {
      return await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'sharely' },
          (error, result) => {
            if (error) {
              console.error('Stream error:', error);
              return reject(error);
            }
            resolve(result!.secure_url);
          },
        ).end(file.buffer);
      });
    } catch (err: any) {
      console.error('=== CLOUDINARY ERROR ===');
      console.error('Message:', err.message);
      console.error('HTTP Code:', err.http_code);
      console.error('Full error:', JSON.stringify(err, null, 2));
      throw new InternalServerErrorException(
        `Upload failed: ${err.message || JSON.stringify(err)}`,
      );
    }
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
