# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Instagram-style social media app. Monorepo with two independent projects:
- `backend/` — NestJS REST API + WebSockets, PostgreSQL via TypeORM
- `frontend/` — React Native (Expo SDK 54) with Expo Router file-based navigation

---

## Commands

### Backend (`cd backend`)
```bash
npm run start:dev      # dev server with watch (port 3000)
npm run build          # compile to dist/
npm run start:prod     # run compiled build
npm run lint           # eslint --fix
npm test               # jest unit tests
npm run test:e2e       # e2e tests
npx ts-node -r tsconfig-paths/register src/seed.ts   # seed the database
```

### Frontend (`cd frontend`)
```bash
npx expo start         # start Expo dev server (scan QR with Expo Go)
npx expo start --android
npx expo start --ios
npm run lint           # expo lint
```

---

## Backend Architecture

All routes are prefixed `/api`. Global `ValidationPipe` (whitelist + transform) and `ClassSerializerInterceptor` are active.

**Modules:**
- `AuthModule` — JWT + Passport local strategy, `POST /api/auth/login` returns `{ token, user }`
- `UsersModule` — user profiles, follow/unfollow
- `PostsModule` — feed posts and reels (`/api/posts/feed`, `/api/posts/reels`)
- `MediaModule` — file uploads via Multer, served statically at `/uploads`
- `ChatModule` — DM conversations via WebSockets (Socket.IO) + REST (`/api/chat/conversations`)
- `NotificationsModule` — push/in-app notifications

**Database:** PostgreSQL. Config via `.env` (see `.env.example`). TypeORM `synchronize: true` in dev — schema auto-migrates on start.

**Seed script** creates 3 users (`mehdi@gmail.com/mehdi123`, `alex@gmail.com/alex123`, `maria@gmail.com/maria123`), sample posts, reels, and chat messages.

---

## Frontend Architecture

### Routing (Expo Router)
Files in `app/` define routes. Current routes:
- `app/index.tsx` → Home feed (tab)
- `app/explore.tsx` → Explore grid (tab)
- `app/Reels.tsx` → Reels (tab)
- `app/DirectMessages.tsx` → DMs (tab)
- `app/Profile.tsx` → Own profile (tab)
- `app/Camera.tsx` → Camera (hidden from tab bar, pushed via router)
- `app/Auth.tsx` → Login screen (redirected to when unauthenticated)

Each `app/*.tsx` file is a thin wrapper that just renders the matching component from `components/`. All actual screen logic lives in `components/`.

### Two-file pattern
`app/Profile.tsx` renders `<Profile />` from `components/Profile.tsx`. Follow this pattern for all new screens.

### Global State
- `context/ThemeContext.tsx` — `ThemeProvider` + `useTheme()`. Provides `{ colors, isDark, toggleTheme }`. Theme persisted to AsyncStorage (`@instagram_theme`). Toggle lives in Profile screen's bottom menu.
- `context/AuthContext.tsx` — `AuthProvider` + `useAuth()`. Provides `{ user, login, logout }`. Session persisted to AsyncStorage (`@instagram_user`).

Both providers wrap the entire app in `app/_layout.tsx` in this order: `ThemeProvider > AuthProvider > AuthGuard > TabsLayout`.

### Theming
**Always use `useTheme()` for colors** — never hard-code hex values in components. Import from `../context/ThemeContext`. Use inline style overrides for color-only properties: `[styles.foo, { backgroundColor: colors.background }]`. `ReelsScreen` is intentionally exempt — full-screen video always needs dark colors.

Color tokens: `background`, `card`, `border`, `text`, `textSecondary`, `inputBg`, `iconActive`, `iconInactive`, `tabBar`, `storyRing`, `like`, `primary`, `surface`, `overlay`.

### API calls
Use `utils/api.ts` helpers: `apiGet<T>`, `apiPost<T>`, `apiPatch<T>`, `apiDelete`. They auto-attach the JWT Bearer token from AsyncStorage.

**API base URL** is set in `config/env.ts`. Change `API_URL` to your machine's local IP when testing on a physical device (Android emulator uses `10.0.2.2:3000/api`, iOS simulator uses `localhost:3000/api`).