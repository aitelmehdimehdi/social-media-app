import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function clear() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🗑️  Clearing content tables...');

  await dataSource.query('TRUNCATE TABLE stories CASCADE');
  await dataSource.query('TRUNCATE TABLE likes CASCADE');
  await dataSource.query('TRUNCATE TABLE comments CASCADE');
  await dataSource.query('TRUNCATE TABLE reels CASCADE');
  await dataSource.query('TRUNCATE TABLE posts CASCADE');

  console.log('✅ posts, reels, stories, likes, comments cleared');
  console.log('ℹ️  Users and follows are kept intact');

  await app.close();
}

clear().catch((err) => {
  console.error('❌ Clear failed:', err);
  process.exit(1);
});
