import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { PostsService } from './posts/posts.service';
import { ChatService } from './chat/chat.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const postsService = app.get(PostsService);
  const chatService = app.get(ChatService);

  console.log('🌱 Seeding database...');

  // ── Create 3 users ────────────────────────────────────────────────────────
  const mehdi = await usersService.create({
    username: 'mehdi.dev',
    email: 'mehdi@gmail.com',
    password: 'mehdi123',
    fullName: 'Mehdi',
  });
  await usersService['userRepo'].update(mehdi.id, {
    bio: '📱 Mobile developer\n🚀 Building cool stuff\n📍 Fes, Morocco',
  });

  const alex = await usersService.create({
    username: 'alex.photo',
    email: 'alex@gmail.com',
    password: 'alex123',
    fullName: 'Alex Photography',
  });
  await usersService['userRepo'].update(alex.id, {
    bio: '📷 Photographer | Paris lover',
  });

  const maria = await usersService.create({
    username: 'maria_art',
    email: 'maria@gmail.com',
    password: 'maria123',
    fullName: 'Maria Art',
  });
  await usersService['userRepo'].update(maria.id, {
    bio: '🎨 Digital artist | New York',
  });

  console.log('✅ Users created');

  // ── Follow each other ────────────────────────────────────────────────────
  await usersService.follow(mehdi.id, alex.id);
  await usersService.follow(mehdi.id, maria.id);
  await usersService.follow(alex.id, mehdi.id);
  await usersService.follow(maria.id, mehdi.id);

  console.log('✅ Follows created');

  // ── Create posts ─────────────────────────────────────────────────────────
  await postsService.createPost(alex.id, {
    imageUrl: 'https://picsum.photos/seed/paris/600/600',
    caption: 'Golden hour in the city of lights ✨',
    location: 'Paris, France',
  });

  await postsService.createPost(maria.id, {
    imageUrl: 'https://picsum.photos/seed/art/600/600',
    caption: 'New piece just dropped 🎨 Let me know what you think!',
    location: 'New York, USA',
  });

  await postsService.createPost(mehdi.id, {
    imageUrl: 'https://picsum.photos/seed/bali/600/600',
    caption: 'Built this in React Native 🚀 #coding #reactnative',
    location: 'Fes, Morocco',
  });

  console.log('✅ Posts created');

  // ── Create reels ──────────────────────────────────────────────────────────
  await postsService.createReel(alex.id, {
    thumbnailUrl: 'https://picsum.photos/seed/reel1/600/1000',
    caption: 'Golden hour vibes in Paris 🌅 #travel #paris',
    audioTitle: '🎵 Lofi Chill — Autumn Breeze',
  });

  await postsService.createReel(maria.id, {
    thumbnailUrl: 'https://picsum.photos/seed/reel2/600/1000',
    caption: 'New digital art piece — 72 hours of work 🎨✨',
    audioTitle: '🎵 Ambient Dreams — Vol.3',
  });

  await postsService.createReel(mehdi.id, {
    thumbnailUrl: 'https://picsum.photos/seed/reel5/600/1000',
    caption: 'Built this in React Native in 2 hours 🚀 #coding',
    audioTitle: '🎵 Focus Mode — Deep Work',
  });

  console.log('✅ Reels created');

  // ── Create messages ───────────────────────────────────────────────────────
  await chatService.sendMessage(alex.id, mehdi.id, 'That photo is 🔥🔥');
  await chatService.sendMessage(mehdi.id, alex.id, 'Thanks man! 🙏');
  await chatService.sendMessage(maria.id, mehdi.id, 'Can you send me the file?');

  console.log('✅ Messages created');
  console.log('\n🎉 Seed complete! You can now login with:');
  console.log('   mehdi@gmail.com / mehdi123');
  console.log('   alex@gmail.com  / alex123');
  console.log('   maria@gmail.com / maria123');

  await app.close();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
