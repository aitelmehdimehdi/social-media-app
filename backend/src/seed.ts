import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { PostsService } from './posts/posts.service';
import { ChatService } from './chat/chat.service';
import { AdsService } from './ads/ads.service';
import { User } from './users/user.entity';
import { Post } from './posts/post.entity';
import { Like } from './posts/like.entity';
import { Comment } from './posts/comment.entity';
import { CommentLike } from './posts/comment-like.entity';
import { SavedPost } from './posts/saved-post.entity';
import { Reel } from './posts/reel.entity';
import { Ad } from './ads/ad.entity';
import { Follow } from './users/follow.entity';
import { Message } from './chat/message.entity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateInLastDays(maxDays: number): Date {
  return new Date(Date.now() - Math.random() * maxDays * 86_400_000);
}

// ─── Users (20) ───────────────────────────────────────────────────────────────

const USERS = [
  {
    username: 'mehdi.dev',
    email: 'mehdi@gmail.com',
    password: 'mehdi123',
    fullName: 'Mehdi Ait El Mehdi',
    avatar: 'https://i.pravatar.cc/150?img=11',
    bio: '📱 Mobile dev · React Native & NestJS\n🚀 Building cool stuff\n📍 Fes, Morocco',
  },
  {
    username: 'alex.photo',
    email: 'alex@gmail.com',
    password: 'alex123',
    fullName: 'Alex Chen',
    avatar: 'https://i.pravatar.cc/150?img=32',
    bio: '📷 Street & portrait photographer\n🌍 Paris → Tokyo\n💌 DM for collabs',
  },
  {
    username: 'maria_art',
    email: 'maria@gmail.com',
    password: 'maria123',
    fullName: 'Maria Vasquez',
    avatar: 'https://i.pravatar.cc/150?img=47',
    bio: '🎨 Digital & oil painter\n🖼️ Commissions open\n📍 Barcelona, Spain',
  },
  {
    username: 'lucas.travel',
    email: 'lucas@gmail.com',
    password: 'lucas123',
    fullName: 'Lucas Moreau',
    avatar: 'https://i.pravatar.cc/150?img=56',
    bio: '🌏 Travel blogger · 52 countries\n✈️ Bali right now',
  },
  {
    username: 'sara.fit',
    email: 'sara@gmail.com',
    password: 'sara123',
    fullName: 'Sara Benali',
    avatar: 'https://i.pravatar.cc/150?img=25',
    bio: '💪 Fitness coach · Nutrition nerd\n🥗 Healthy recipes weekly\n📍 Dubai',
  },
  {
    username: 'nina.eats',
    email: 'nina@gmail.com',
    password: 'nina123',
    fullName: 'Nina Rossi',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: '🍝 Food blogger & home chef\n📍 Milan, Italy\n👩‍🍳 New recipe every Sunday',
  },
  {
    username: 'jake.wild',
    email: 'jake@gmail.com',
    password: 'jake123',
    fullName: 'Jake Morrison',
    avatar: 'https://i.pravatar.cc/150?img=8',
    bio: '🌿 Nature & wildlife photographer\n🦁 East Africa last month\n📍 Cape Town',
  },
  {
    username: 'priya.codes',
    email: 'priya@gmail.com',
    password: 'priya123',
    fullName: 'Priya Sharma',
    avatar: 'https://i.pravatar.cc/150?img=16',
    bio: '👩‍💻 Full-stack dev · Open source\n🔧 TypeScript · Node · React\n📍 Bangalore',
  },
  {
    username: 'carlos.music',
    email: 'carlos@gmail.com',
    password: 'carlos123',
    fullName: 'Carlos Rivera',
    avatar: 'https://i.pravatar.cc/150?img=3',
    bio: '🎸 Guitarist & producer\n🎵 Indie rock · Electronic\n📍 Buenos Aires',
  },
  {
    username: 'emma.style',
    email: 'emma@gmail.com',
    password: 'emma123',
    fullName: 'Emma Laurent',
    avatar: 'https://i.pravatar.cc/150?img=20',
    bio: '👗 Fashion stylist & content creator\n✨ Style tips weekly\n📍 Paris, France',
  },
  {
    username: 'tom.garage',
    email: 'tom@gmail.com',
    password: 'tom123',
    fullName: 'Tom Bradley',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: '🚗 Car enthusiast & mechanic\n🏎️ Classic & supercars\n📍 Los Angeles',
  },
  {
    username: 'lena.zen',
    email: 'lena@gmail.com',
    password: 'lena123',
    fullName: 'Lena Fischer',
    avatar: 'https://i.pravatar.cc/150?img=9',
    bio: '🧘 Yoga instructor · Mindfulness coach\n🌿 200hr certified\n📍 Bali & Berlin',
  },
  {
    username: 'sam.sports',
    email: 'sam@gmail.com',
    password: 'sam123',
    fullName: 'Sam Okafor',
    avatar: 'https://i.pravatar.cc/150?img=6',
    bio: '⚽ Sports photographer & analyst\n🏆 Covering UEFA & NBA\n📍 London',
  },
  {
    username: 'diana.draws',
    email: 'diana@gmail.com',
    password: 'diana123',
    fullName: 'Diana Park',
    avatar: 'https://i.pravatar.cc/150?img=19',
    bio: '✏️ Illustrator & comic artist\n📚 Published in 3 countries\n📍 Seoul, Korea',
  },
  {
    username: 'max.adventures',
    email: 'max@gmail.com',
    password: 'max123',
    fullName: 'Max Weber',
    avatar: 'https://i.pravatar.cc/150?img=15',
    bio: '🎒 Travel vlogger · Backpacker\n🗺️ South America → Asia\n📍 Somewhere new',
  },
  {
    username: 'zoe.kitchen',
    email: 'zoe@gmail.com',
    password: 'zoe123',
    fullName: 'Zoe Martin',
    avatar: 'https://i.pravatar.cc/150?img=23',
    bio: '👩‍🍳 Professional chef · Recipe developer\n🍴 French-Japanese fusion\n📍 Singapore',
  },
  {
    username: 'ryan.pump',
    email: 'ryan@gmail.com',
    password: 'ryan123',
    fullName: 'Ryan Torres',
    avatar: 'https://i.pravatar.cc/150?img=13',
    bio: '🏋️ Personal trainer · 8y exp\n💪 Strength & conditioning\n📍 Miami, FL',
  },
  {
    username: 'ali.builds',
    email: 'ali@gmail.com',
    password: 'ali123',
    fullName: 'Ali Hassan',
    avatar: 'https://i.pravatar.cc/150?img=7',
    bio: '🛠️ Backend dev · DevOps\n☁️ AWS · Docker · NestJS\n📍 Cairo, Egypt',
  },
  {
    username: 'mia.looks',
    email: 'mia@gmail.com',
    password: 'mia123',
    fullName: 'Mia Johnson',
    avatar: 'https://i.pravatar.cc/150?img=18',
    bio: '💄 Fashion & beauty creator\n✨ GRWM · Hauls · Styling\n📍 New York City',
  },
  {
    username: 'omar.lens',
    email: 'omar@gmail.com',
    password: 'omar123',
    fullName: 'Omar Khalil',
    avatar: 'https://i.pravatar.cc/150?img=2',
    bio: '🦅 Wildlife & landscape photographer\n📸 Canon R5\n📍 Morocco & Namibia',
  },
];

// ─── Post themes (10 × 8 = 80 posts) ─────────────────────────────────────────

interface PostTheme {
  seeds: string[];
  captions: string[];
  locations: string[];
  userIndices: number[];
}

const POST_THEMES: PostTheme[] = [
  // ── TRAVEL ──
  {
    seeds: ['alps-sunrise', 'bali-rice', 'tokyo-neon', 'paris-eiffel', 'morocco-medina', 'nyc-skyline', 'santorini-blue', 'maldives-ocean'],
    captions: [
      'Golden hour in the Alps ⛰️ Worth every step of the hike. #travel #alps #wanderlust #explore #adventure',
      'Rice terraces at sunrise 🌾 Set that alarm for 4am — no regrets ever. #bali #travel #wanderlust #paradise',
      'Tokyo after midnight hits different 🌆 The city that never sleeps, literally. #tokyo #japan #travel #nightlife',
      'She\'s always beautiful, always different ✨ Paris never disappoints. #paris #france #travel #explore',
      'Lost in the medina and loving every second 🕌 #morocco #marrakech #travel #culture #wanderlust',
      'NYC from above 🗽 This city has a pulse you can actually feel. #newyork #travel #citylife #wanderlust',
      'Santorini sunsets are overrated... said no one ever 🌅 #santorini #greece #travel #sunset #explore',
      'Overwater bungalow life 🌊 Sometimes you just have to treat yourself. #maldives #travel #luxury #ocean',
    ],
    locations: ['Swiss Alps', 'Ubud, Bali', 'Tokyo, Japan', 'Paris, France', 'Marrakech, Morocco', 'New York, USA', 'Santorini, Greece', 'Maldives'],
    userIndices: [1, 3, 14],
  },
  // ── FOOD ──
  {
    seeds: ['pasta-homemade', 'sushi-omakase', 'acai-bowl', 'smash-burger', 'tonkotsu-ramen', 'street-tacos', 'birthday-cake', 'pour-over-coffee'],
    captions: [
      'Handmade pasta from scratch 🍝 3 hours of work, 8 minutes to eat. Zero regrets. #food #pasta #foodie #homecooking #instafood',
      'Omakase night 🍣 The chef\'s kiss was literal this time. #sushi #japanese #food #omakase #foodie #delicious',
      'Açaí bowl game strong 🫐 High protein, guilt-free, Instagram-ready. #healthyfood #acai #foodie #instafood',
      'I said what I said 🍔 The smash burger will never not be it. #burger #smashburger #foodie #instafood #delicious',
      'Tonkotsu at midnight 🍜 Tokyo really said "eat well always." #ramen #japan #food #foodie #delicious',
      'Taco Tuesday needs a rebrand to every day 🌮 #tacos #mexican #food #foodie #instafood #delicious',
      'Birthday cake energy, no occasion needed 🎂 #cake #dessert #food #sweettooth #foodie #instafood',
      'Morning pour-over ritual ☕ The grind never stops (literally). #coffee #coffeeart #barista #foodie #morning',
    ],
    locations: ['Home Kitchen', 'Tokyo, Japan', 'Los Angeles, USA', 'NYC, USA', 'Tokyo, Japan', 'Mexico City', 'Paris, France', 'Melbourne, Australia'],
    userIndices: [5, 15, 4],
  },
  // ── FITNESS ──
  {
    seeds: ['barbell-squat', 'morning-run', 'yoga-warrior', 'road-cycling', 'crossfit-box', 'swim-lane', 'boxing-heavy', 'hiit-circuit'],
    captions: [
      'Progressive overload week 12 💪 Numbers don\'t lie, consistency does. #gym #weightlifting #fitness #strength #workout',
      'Pre-dawn run resets everything 🌅 5km before the world wakes up. #running #5k #fitness #morningrun #wellness',
      'Finding stillness in movement 🧘 60-day streak complete. #yoga #mindfulness #fitness #breathe #wellness',
      'Sunday rides cure Sunday scaries 🚴 85km, 3 hours, new PR. #cycling #roadbike #fitness #endurance #sports',
      'WOD complete 🔥 You think you\'re done and then you\'re not. That\'s the whole point. #crossfit #fitness #workout #grind',
      'Water therapy is real 🏊 1km open water, 28 mins. Slow is smooth, smooth is fast. #swimming #fitness #workout',
      'Hands up, chin down, heart rate up 🥊 Boxing is meditation with consequences. #boxing #fitness #gym #sport',
      'HIIT > everything. 20 mins, 400 calories, can\'t walk now 🔥 #hiit #fitness #workout #cardio #gym',
    ],
    locations: ['Dubai Fitness First', 'Dubai Creek', 'Bali Yoga Studio', 'Alps Route', 'CrossFit Box', 'Olympic Pool', 'Boxing Academy', 'Studio'],
    userIndices: [4, 16, 11],
  },
  // ── TECH ──
  {
    seeds: ['battlestation-rgb', 'macbook-dark', 'server-rack', 'raspberry-pi', 'vr-future', 'robotic-arm', 'ultrawide-setup', 'keyboard-backlit'],
    captions: [
      'The battlestation after 6 months of upgrades 🖥️ Still not done. Never done. #techsetup #devsetup #coding #tech',
      'Shipped 5 features before noon ☕ Dark mode + mech keyboard + silence = flow state. #coding #developer #productivity #tech',
      'Scaled from 100 to 100k users overnight 📈 A lesson in humility and architecture. #backend #devops #aws #tech #innovation',
      'This little board runs my entire smart home 🤖 #raspberrypi #iot #tech #embedded #maker #innovation',
      'The future of UI is genuinely weird and I am here for it 🥽 #vr #tech #innovation #future #xr #coding',
      'Day 1 with the new robotic arm. It already outperforms me 🤖 #robotics #automation #tech #innovation #future',
      'Ultrawide + vertical monitor = unlocked new productivity tier 🚀 #devsetup #monitors #coding #tech #workfromhome',
      'That RGB glow at 2am deep in a bug fix 💜 Worth it when it finally passes. #mechanicalkeyboard #coding #tech #rgb',
    ],
    locations: ['Home Office', 'Remote', 'Data Center', 'Maker Space', 'Tech Lab', 'R&D Lab', 'Home Office', 'Night Office'],
    userIndices: [0, 7, 17],
  },
  // ── FASHION ──
  {
    seeds: ['street-layering', 'pfw-backstage', 'thrift-vintage', 'bag-detail', 'sneaker-display', 'camel-coat', 'summer-linen', 'all-black-look'],
    captions: [
      'Street style is the truest fashion 🧥 No rules, all vibes. #fashion #streetstyle #ootd #style #outfitoftheday',
      'Backstage at PFW — controlled chaos is the best chaos ✨ #pfw #fashion #runway #style #paris',
      'Thrift store find of the century 🕶️ €8 for this entire look. Respect the hunt. #vintage #thrift #fashion #ootd #sustainable',
      'The bag is the whole personality right now 👜 #accessories #fashion #luxury #style #ootd',
      'The wall grows 👟 Cannot be stopped, will not be stopped. #sneakers #kicks #fashion #sneakerhead #hype',
      'Cashmere coat season is the only season that matters 🧣 #fashion #winter #ootd #style #coat',
      'Linen in July hits different 🌿 Simple done right. #fashion #ootd #style #minimalist #summer',
      'All black everything, forever 🖤 #monochrome #blackfashion #ootd #minimalism #fashion #style',
    ],
    locations: ['Paris, France', 'Milan Fashion Week', 'Vintage Market, Berlin', 'Milan, Italy', 'Sneaker Store NYC', 'London', 'Barcelona', 'New York'],
    userIndices: [9, 18, 2],
  },
  // ── NATURE ──
  {
    seeds: ['forest-mist', 'waterfall-long', 'alpine-lake', 'sahara-dunes', 'big-sur-waves', 'vermont-fall', 'aurora-iceland', 'antelope-canyon'],
    captions: [
      'The forest doesn\'t care about your deadlines 🌲 That\'s exactly why I come here. #nature #forest #hiking #wellness #outdoors',
      'Chased this waterfall for 3 hours 💦 Would do it again immediately. #waterfall #hiking #nature #explore #adventure',
      'Mountain lake at 2800m altitude 🏔️ Water so clear it looks edited. It isn\'t. #nature #mountains #lake #hiking #travel',
      'Sahara at blue hour 🌅 Nothing prepares you for this scale. #sahara #desert #nature #morocco #travel #explore',
      'The ocean makes everything else feel small 🌊 That\'s the point. #ocean #waves #nature #beach #mindfulness',
      'Autumn showed up and I have zero complaints 🍂 #autumn #fall #nature #leaves #golden #explore',
      'Bucket list: checked ✅ Northern lights at midnight in Iceland 🌌 #northernlights #iceland #nature #aurora #travel',
      'Antelope Canyon from the bottom up 🟠 The light beams are real, no filter. #canyon #arizona #nature #travel #explore',
    ],
    locations: ['Black Forest, Germany', 'Plitvice, Croatia', 'Dolomites, Italy', 'Sahara, Morocco', 'Big Sur, California', 'Vermont, USA', 'Iceland', 'Arizona, USA'],
    userIndices: [6, 19, 1],
  },
  // ── ART ──
  {
    seeds: ['oil-canvas', 'street-mural', 'sculpture-white', 'darkroom-print', 'procreate-wip', 'pottery-wheel', 'sketchbook-open', 'gallery-night'],
    captions: [
      'New oil painting — 40 hours from blank canvas to this 🎨 The process always surprises me. #art #oilpainting #artist #fineart',
      'Found this mural in a back alley 🖌️ Art is everywhere when you actually look. #streetart #mural #art #urbanart',
      'Spent an afternoon in the sculpture garden ⚫ Every angle tells a completely different story. #sculpture #art #museum #fineart',
      'First print run of the "Solitude" series 📷 5 editions of 10. DM for inquiries. #photography #print #art #fineart',
      'Two weeks on this piece 💻 Digital art is painting with unlimited undo and I\'m grateful. #digitalart #illustration #art #procreate',
      'Clay day 🏺 There\'s something deeply satisfying about making something from nothing. #ceramics #pottery #art #handmade',
      'Morning sketchbook pages 📒 No goals, no audience, just the page. #sketch #drawing #art #sketchbook #creative',
      'Gallery opening night for "Between Worlds" 🥂 Grateful for everyone who came out ✨ #art #gallery #opening #exhibition',
    ],
    locations: ['Studio', 'Shoreditch, London', 'Sculpture Park NYC', 'Darkroom', 'Home Studio', 'Ceramics Workshop', 'Morning Studio', 'Gallery'],
    userIndices: [2, 13, 5],
  },
  // ── MUSIC ──
  {
    seeds: ['les-paul-stage', 'studio-console', 'vinyl-wall', 'steinway-night', 'crowd-hands', 'dj-booth', 'fender-bass', 'pearl-drums'],
    captions: [
      'New riff at 1am 🎸 This is why I keep a recorder on my nightstand. #music #guitar #songwriter #indie #rock',
      'Studio day 6 — the album is taking shape 🎧 Can\'t say more yet. Soon. #music #studio #recording #producer',
      '427 records and counting 🎵 Vinyl will outlive us all. #vinyl #records #music #collector #audiophile',
      'Late night piano when no one\'s watching 🎹 The best sessions are always unplanned. #piano #music #latenight #songwriting',
      'Front row at a sold-out show 🤘 This is why we do everything. #concert #livemusic #music #festival',
      'New mix is up — link in bio 🎧 Been working on this one for months. #music #electronicmusic #mix #producer',
      'Bass lines are underrated and I will die on this hill 🎸 #bass #music #funk #groove #musician',
      '3 hours of drums today 🥁 Practice makes permanent, not perfect. #drums #drumming #music #practice #percussionist',
    ],
    locations: ['Bedroom Studio', 'Abbey Road London', 'Record Room', 'Home Studio', 'O2 Arena London', 'Club Studio', 'Studio', 'Practice Room'],
    userIndices: [8, 3, 0],
  },
  // ── SPORTS ──
  {
    seeds: ['football-training', 'basketball-court', 'tennis-clay', 'marathon-finish', 'surf-barrel', 'ski-carve', 'bouldering-send', 'criterium-race'],
    captions: [
      'Training day 200 of 365 ⚽ The grind is the goal. #football #training #sports #fitness #soccer',
      'Fadeaway from the top of the key 🏀 Nothing but net, all day. #basketball #hoops #sports #streetball',
      'Match point mentality 🎾 Dropped the first set, took the next two. Never panic. #tennis #sports #match #fitness',
      'First marathon crossed 🏅 4:12:03 — going sub-4 next time, no question. #marathon #running #sports #finisher',
      'Caught the set of the session 🏄 The ocean was generous today. #surfing #waves #sports #ocean #surf',
      'First black run of the season and the legs remember everything ⛷️ #skiing #snow #sports #winter #alps',
      'New route sent 🧗 V5 felt impossible three months ago. Consistency is real. #climbing #bouldering #sports #fitness',
      'Sprint finish with 2km left 🚴 Everything hurts and it\'s absolutely perfect. #cycling #race #sports #endurance',
    ],
    locations: ['Training Ground', 'Outdoor Court LA', 'Roland Garros', 'Berlin Marathon', 'Bali, Indonesia', 'Verbier, Switzerland', 'Climbing Gym', 'Alps Circuit'],
    userIndices: [12, 4, 16],
  },
  // ── CARS ──
  {
    seeds: ['ferrari-f40', 'porsche-993', 'mustang-67', 'lambo-huracan', 'ae86-drift', 'beetle-barn', 'hypercar-row', 'pch-drive'],
    captions: [
      'The prancing horse in its natural habitat 🐎 Ferrari F40 — still the pinnacle, always. #ferrari #cars #supercar #automotive #classic',
      'Air-cooled 993 is the purist\'s choice and I won\'t hear otherwise 🏎️ #porsche #911 #cars #aircooled #automotive',
      '1967 Mustang Fastback 🇺🇸 A car that makes a statement without saying a word. #mustang #ford #classic #cars #american',
      'The Lamborghini detail took 14 hours. Not a single swirl mark 💛 #lamborghini #detailing #cars #automotive #supercar',
      'Sideways through corner 7 🔥 Tire smoke is my cologne. #drifting #motorsport #cars #jdm #sports',
      'Found this split-window Bug in a Bavarian barn 🪲 Original paint, runs perfectly. #volkswagen #beetle #classic #cars',
      '7 hypercars in one driveway — a Tuesday in Monaco 🎰 #supercars #monaco #cars #hypercar #exotic #automotive',
      'Pacific Coast Highway at golden hour 🌅 This is what freedom looks like. #roadtrip #cars #california #sunset #drive',
    ],
    locations: ['Maranello, Italy', 'Stuttgart, Germany', 'LA Auto Show', 'Monaco', 'Drift Circuit', 'Bavaria, Germany', 'Monaco', 'PCH, California'],
    userIndices: [10, 3, 12],
  },
];

// ─── Realistic comment pool ───────────────────────────────────────────────────

const COMMENT_POOL = [
  'This is absolutely breathtaking 😍',
  'Adding this to my bucket list right now!',
  'How long did it take to get here? Worth it?',
  'The colors in this photo are genuinely unreal 🌅',
  'You\'re making me want to drop everything and travel 😭',
  'Which camera did you use for this? The quality is insane',
  'Stunning — the composition here is perfect 📸',
  'I was there last summer — best trip of my life honestly!',
  'This looks incredible! Recipe please? 🙏',
  'I can literally smell this through the screen 🤤',
  'Stop making me hungry at midnight 😭',
  'The presentation is absolutely gorgeous, wow',
  'What restaurant is this? Need the name ASAP',
  'You\'re genuinely a wizard in the kitchen 🧑‍🍳',
  'Calories don\'t count if it\'s this beautiful right?',
  'The dedication you have is so inspiring 💪',
  'What\'s your training split? I need this program',
  'You\'re making the rest of us look bad 😅',
  'The gains are seriously showing!! Keep going 🔥',
  'Don\'t forget rest days though — recovery is key!',
  'This setup is absolute goals 🖥️',
  'What monitor is that? Asking seriously',
  'Ship it!! Can\'t wait to try this feature',
  'The cable management is *chef\'s kiss* perfection',
  'Name the stack? This looks clean as anything',
  'This is genuinely incredible work 🎨',
  'The attention to detail here is absolutely insane',
  'How long have you been doing this? The skill level!',
  'I\'d buy this piece in a heartbeat 💙',
  'These colors work so perfectly together',
  'This deserves to be in a gallery, no question',
  'This is everything 🔥',
  'Absolutely love this so much!!',
  'Literal goals 🙏',
  'Keep it up — this content is amazing',
  'Saved! Coming back to this for sure',
  'This genuinely made my whole day',
  'Real ones know the vibe 👏',
  'Not me actually dying over how good this is 😭',
  'Can\'t stop looking at this honestly',
  'Okay but HOW though?? 😭🔥',
  'The vibe here is completely immaculate',
  'Not a single bad angle in this whole post',
  'This is the exact content I\'m here for',
  'W post as always, never miss 🔥',
  'Sending this to everyone I know rn',
  'Woke up and chose excellence I see 👑',
  'This hit different today, needed to see this',
  'The energy in this photo ✨',
  'You never disappoint, seriously',
];

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });

  const usersService = app.get(UsersService);
  const postsService = app.get(PostsService);
  const chatService = app.get(ChatService);
  const adsService = app.get(AdsService);

  const userRepo    = app.get<Repository<User>>(getRepositoryToken(User));
  const postRepo    = app.get<Repository<Post>>(getRepositoryToken(Post));
  const likeRepo    = app.get<Repository<Like>>(getRepositoryToken(Like));
  const commentRepo = app.get<Repository<Comment>>(getRepositoryToken(Comment));
  const commentLikeRepo = app.get<Repository<CommentLike>>(getRepositoryToken(CommentLike));
  const savedPostRepo   = app.get<Repository<SavedPost>>(getRepositoryToken(SavedPost));
  const reelRepo    = app.get<Repository<Reel>>(getRepositoryToken(Reel));
  const adRepo      = app.get<Repository<Ad>>(getRepositoryToken(Ad));
  const followRepo  = app.get<Repository<Follow>>(getRepositoryToken(Follow));
  const messageRepo = app.get<Repository<Message>>(getRepositoryToken(Message));

  // ── 1. Clear all tables ───────────────────────────────────────────────────
  console.log('🗑️  Clearing existing data...');
  await commentLikeRepo.delete({});
  await savedPostRepo.delete({});
  await likeRepo.delete({});
  await commentRepo.delete({});
  await reelRepo.delete({});
  await postRepo.delete({});
  await adRepo.delete({});
  await followRepo.delete({});
  await messageRepo.delete({});
  await userRepo.delete({});
  console.log('✅ Database cleared\n');

  // ── 2. Create 20 users ────────────────────────────────────────────────────
  console.log('👤 Creating 20 users...');
  const users: User[] = [];

  for (const data of USERS) {
    const user = await usersService.create({
      username: data.username,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
    });
    await userRepo.update(user.id, { avatar: data.avatar, bio: data.bio });
    users.push({ ...user, avatar: data.avatar, bio: data.bio } as User);
    console.log(`  ✓ @${data.username}`);
  }

  // ── 3. Follow relationships (5–10 random per user) ────────────────────────
  console.log('\n🔗 Creating follow relationships...');
  let totalFollows = 0;

  for (let i = 0; i < users.length; i++) {
    const otherIndices = Array.from({ length: users.length }, (_, k) => k)
      .filter((k) => k !== i)
      .sort(() => Math.random() - 0.5);

    const followCount = randInt(5, 10);
    for (const j of otherIndices.slice(0, followCount)) {
      await usersService.follow(users[i].id, users[j].id);
      totalFollows++;
    }
  }
  console.log(`  ✓ ${totalFollows} follow relationships`);

  // ── 4. Create 80 posts (10 themes × 8 posts each) ─────────────────────────
  console.log('\n📸 Creating 80 posts...');
  const posts: Post[] = [];

  for (const theme of POST_THEMES) {
    for (let i = 0; i < theme.seeds.length; i++) {
      const userIndex = theme.userIndices[i % theme.userIndices.length];
      const user = users[userIndex];

      const post = postRepo.create({
        userId: user.id,
        imageUrl: `https://picsum.photos/seed/${theme.seeds[i]}/600/600`,
        caption: theme.captions[i],
        location: theme.locations[i],
        likesCount: randInt(10, 2000),
        commentsCount: randInt(2, 150),
      });

      const saved = await postRepo.save(post);

      // Back-date to a random point in the last 30 days
      const createdAt = randomDateInLastDays(30);
      await postRepo.query(
        `UPDATE posts SET "createdAt" = $1 WHERE id = $2`,
        [createdAt, saved.id],
      );

      await userRepo.increment({ id: user.id }, 'postsCount', 1);

      posts.push({ ...saved, createdAt } as Post);
    }
  }
  console.log(`  ✓ ${posts.length} posts`);

  // ── 5. 500 random post likes ──────────────────────────────────────────────
  console.log('\n❤️  Creating 500 post likes...');
  const likeKeys = new Set<string>();
  const likeBatch: Like[] = [];

  while (likeBatch.length < 500) {
    const user = pick(users);
    const post = pick(posts);
    const key = `${user.id}:${post.id}`;
    if (!likeKeys.has(key) && user.id !== post.userId) {
      likeKeys.add(key);
      likeBatch.push(likeRepo.create({ userId: user.id, postId: post.id }));
    }
  }

  for (let i = 0; i < likeBatch.length; i += 100) {
    await likeRepo.save(likeBatch.slice(i, i + 100));
  }
  console.log(`  ✓ 500 post likes`);

  // ── 6. 200 comments ───────────────────────────────────────────────────────
  console.log('\n💬 Creating 200 comments...');
  const commentBatch: Comment[] = [];

  for (let i = 0; i < 200; i++) {
    const user = pick(users);
    const post = pick(posts);
    // Skip if user owns the post (not realistic)
    if (user.id === post.userId) continue;
    commentBatch.push(
      commentRepo.create({
        userId: user.id,
        postId: post.id,
        content: pick(COMMENT_POOL),
        parentId: null,
      }),
    );
  }

  for (let i = 0; i < commentBatch.length; i += 50) {
    await commentRepo.save(commentBatch.slice(i, i + 50));
  }
  console.log(`  ✓ ${commentBatch.length} comments`);

  // ── 7. Saves (a few realistic saves) ─────────────────────────────────────
  console.log('\n🔖 Creating saved posts...');
  const saveKeys = new Set<string>();
  const saveBatch = [];

  for (let i = 0; i < 40; i++) {
    const user = pick(users);
    const post = pick(posts);
    const key = `${user.id}:${post.id}`;
    if (!saveKeys.has(key) && user.id !== post.userId) {
      saveKeys.add(key);
      saveBatch.push(savedPostRepo.create({ userId: user.id, postId: post.id }));
    }
  }
  await savedPostRepo.save(saveBatch);
  console.log(`  ✓ ${saveBatch.length} saved posts`);

  // ── 8. Ads (5) ────────────────────────────────────────────────────────────
  console.log('\n📢 Creating 5 ads...');
  const ADS_DATA = [
    { title: 'Try For Free', mediaUrl: 'https://picsum.photos/seed/ad-notion/600/450', caption: '🚀 Notion AI — Organize your work & life in one place. Free 30-day trial.', ctaUrl: 'https://notion.so', sponsorName: 'Notion', isActive: true },
    { title: 'Shop Now', mediaUrl: 'https://picsum.photos/seed/ad-nike/600/450', caption: '👟 Nike Air Max 2025 — The next step in comfort. Available now online & in stores.', ctaUrl: 'https://nike.com', sponsorName: 'Nike', isActive: true },
    { title: 'Start Learning', mediaUrl: 'https://picsum.photos/seed/ad-udemy/600/450', caption: '📚 Master React Native in 8 weeks. Certified with real projects. -30% this month.', ctaUrl: 'https://udemy.com', sponsorName: 'Udemy', isActive: true },
    { title: 'Download Free', mediaUrl: 'https://picsum.photos/seed/ad-spotify/600/450', caption: '🎵 Spotify Premium — 3 months free. No ads. Download anything. Go.', ctaUrl: 'https://spotify.com', sponsorName: 'Spotify', isActive: true },
    { title: 'Book Now', mediaUrl: 'https://picsum.photos/seed/ad-airbnb/600/450', caption: '🏠 Airbnb — Find your next adventure. 10% off first booking with code SHARELY.', ctaUrl: 'https://airbnb.com', sponsorName: 'Airbnb', isActive: true },
  ];

  for (const ad of ADS_DATA) {
    await adsService.create(ad);
    console.log(`  ✓ ${ad.sponsorName}`);
  }

  // ── 9. Reels ──────────────────────────────────────────────────────────────
  console.log('\n🎬 Creating reels...');
  const REELS_DATA = [
    { userIndex: 1,  thumbnailUrl: 'https://picsum.photos/seed/reel-paris/600/1000',   caption: 'Behind the lens in Paris 🌟 #photography #paris #goldenhourgram', audioTitle: '🎵 Lofi Chill — Autumn Breeze' },
    { userIndex: 2,  thumbnailUrl: 'https://picsum.photos/seed/reel-art/600/1000',     caption: 'Speed painting — portrait in 4 minutes 🎨 #digitalart #timelapse #art',    audioTitle: '🎵 Ambient Dreams — Vol.3' },
    { userIndex: 0,  thumbnailUrl: 'https://picsum.photos/seed/reel-code/600/1000',    caption: 'Building a real-time feed in NestJS ⚡ #coding #nestjs #webdev #tech',       audioTitle: '🎵 Focus Mode — Deep Work' },
    { userIndex: 3,  thumbnailUrl: 'https://picsum.photos/seed/reel-bali/600/1000',    caption: 'Day 1 in Bali — everything is beautiful 🌴 #travel #bali #vlog #wanderlust', audioTitle: '🎵 Island Vibes — Summer Mix' },
    { userIndex: 4,  thumbnailUrl: 'https://picsum.photos/seed/reel-gym/600/1000',     caption: 'Morning workout routine 🔥 5 moves, 20 minutes #fitness #workout #gym',      audioTitle: '🎵 Workout Beast — Pump Up' },
    { userIndex: 8,  thumbnailUrl: 'https://picsum.photos/seed/reel-music/600/1000',   caption: 'Studio session preview 🎸 Album dropping soon #music #guitar #indie',        audioTitle: '🎵 Original Track — Untitled' },
    { userIndex: 9,  thumbnailUrl: 'https://picsum.photos/seed/reel-fashion/600/1000', caption: 'Get ready with me — Paris edition 👗 #grwm #fashion #ootd #paris',           audioTitle: '🎵 Runway Vibes — Fashion Mix' },
    { userIndex: 14, thumbnailUrl: 'https://picsum.photos/seed/reel-travel/600/1000',  caption: 'Backpacking Southeast Asia in 60 seconds 🎒 #travel #backpacker #wanderlust', audioTitle: '🎵 Adventure — Epic Cinematic' },
  ];

  for (const r of REELS_DATA) {
    await postsService.createReel(users[r.userIndex].id, {
      thumbnailUrl: r.thumbnailUrl,
      caption: r.caption,
      audioTitle: r.audioTitle,
    });
    console.log(`  ✓ Reel by @${USERS[r.userIndex].username}`);
  }

  // ── 10. Chat messages ─────────────────────────────────────────────────────
  console.log('\n✉️  Creating chat messages...');
  await chatService.sendMessage(users[1].id, users[0].id, 'Dude the new feed algorithm is fire 🔥');
  await chatService.sendMessage(users[0].id, users[1].id, 'Thanks! Scoring-based with interest profiling now 🧠');
  await chatService.sendMessage(users[2].id, users[0].id, 'Love the app! Can we do a collab post?');
  await chatService.sendMessage(users[3].id, users[4].id, 'Hey Sara! That meal prep tutorial was gold 💪');
  await chatService.sendMessage(users[4].id, users[3].id, 'Thanks Lucas! Your Bali content is insane btw 🌴');
  await chatService.sendMessage(users[7].id, users[0].id, 'Just found the app — the tech feed is exactly what I needed');
  await chatService.sendMessage(users[9].id, users[2].id, 'Your art posts always stop my scroll, seriously stunning');
  console.log('  ✓ 7 messages');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Summary:');
  console.log(`  • ${users.length} users`);
  console.log(`  • ${totalFollows} follow relationships`);
  console.log(`  • ${posts.length} posts (10 themes × 8)`);
  console.log(`  • ${REELS_DATA.length} reels`);
  console.log(`  • 5 ads`);
  console.log(`  • 500 post likes`);
  console.log(`  • ${commentBatch.length} comments`);
  console.log(`  • ${saveBatch.length} saved posts`);
  console.log('\n🔑 Login credentials:');
  for (const u of USERS) {
    console.log(`  • ${u.email.padEnd(24)} / ${u.password}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await app.close();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message ?? err);
  process.exit(1);
});
