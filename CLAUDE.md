# CLAUDE.md — Entrenador-plan

## What This Project Is

A mobile app (React Native/Expo) for tracking workouts and nutrition.
Monorepo with two packages: `api/` (Fastify + Prisma + PostgreSQL) and `mobile/` (Expo).

---

## Monorepo Structure

```
Entrenador-plan/
├── README.md
├── CLAUDE.md                     # This file — read first
├── package.json                  # Root npm workspaces config
├── .gitignore
├── .env.example
│
├── api/                          # Fastify + Prisma backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                      # DATABASE_URL, JWT_SECRET (gitignored)
│   ├── prisma/
│   │   ├── schema.prisma         # Single source of truth for all data models
│   │   └── migrations/
│   └── src/
│       ├── index.ts              # Server entry point
│       ├── app.ts                # Fastify app factory (testable)
│       ├── config.ts             # Typed env vars
│       ├── plugins/
│       │   ├── prisma.ts         # Decorates fastify.prisma
│       │   ├── jwt.ts            # JWT plugin
│       │   └── cors.ts
│       ├── hooks/
│       │   └── authenticate.ts   # JWT verification preHandler
│       ├── routes/
│       │   ├── auth/
│       │   ├── workouts/
│       │   ├── nutrition/
│       │   └── plans/
│       ├── schemas/              # Fastify JSON schemas for validation
│       └── lib/
│           ├── password.ts       # bcrypt helpers
│           └── errors.ts         # Typed HTTP error helpers
│
└── mobile/                       # Expo + React Native
    ├── package.json
    ├── tsconfig.json
    ├── app.json
    ├── babel.config.js
    ├── .env                      # EXPO_PUBLIC_API_URL (gitignored)
    └── src/
        ├── app/                  # Expo Router file-based routing
        │   ├── _layout.tsx       # Root layout + auth gate
        │   ├── (auth)/
        │   │   ├── login.tsx
        │   │   └── register.tsx
        │   ├── (tabs)/
        │   │   ├── _layout.tsx   # Bottom tab navigator
        │   │   ├── index.tsx     # Dashboard
        │   │   ├── workouts.tsx
        │   │   ├── nutrition.tsx
        │   │   └── plans.tsx
        │   └── workout/
        │       ├── [sessionId].tsx
        │       └── log.tsx
        ├── components/
        │   ├── ui/               # Generic: Button, Input, Card, Text
        │   └── domain/           # Feature: ExerciseRow, MealCard, etc.
        ├── hooks/                # React Query wrappers
        │   ├── useAuth.ts
        │   ├── useWorkouts.ts
        │   ├── useNutrition.ts
        │   └── usePlans.ts
        ├── services/
        │   └── api.ts            # All API calls + token injection
        ├── store/
        │   └── auth.store.ts     # Zustand auth state
        └── types/
            └── api.types.ts      # Mirrors api/src/schemas/ types
```

---

## Essential Commands

```bash
# Install all workspaces
npm install

# Setup env (then edit api/.env with real values)
cp .env.example api/.env

# Database
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed exercise library (run once)
npm run db:studio     # Open Prisma Studio

# Development
npm run dev:api       # API on http://localhost:3000
npm run dev:mobile    # Expo dev server

# Build
npm run build:api

# Tests
npm test              # All workspaces
npm test --workspace=api
npm test --workspace=mobile

# Lint
npm run lint
```

**First-time setup sequence:**
```bash
npm install
cp .env.example api/.env    # Fill in DATABASE_URL and JWT_SECRET
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:mobile
```

---

## Environment Variables

**`api/.env`**
```
DATABASE_URL=postgresql://user:password@localhost:5432/entrenador
JWT_SECRET=change_me_min_32_chars
JWT_REFRESH_SECRET=change_me_also_min_32_chars
PORT=3000
```

**`mobile/.env`**
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Architecture Decisions

| Concern | Decision | Why |
|---|---|---|
| Backend framework | Fastify | Better performance than Next.js API routes for a pure API |
| ORM | Prisma | Type-safe queries, migrations, Prisma Studio |
| Database | PostgreSQL | Relational data with complex joins needed |
| Auth | JWT access (15m) + refresh tokens (30d) | No session state needed; works well for mobile |
| Token storage (mobile) | `expo-secure-store` | Never AsyncStorage for tokens |
| Navigation | Expo Router | File-based, simpler than manual NavigationContainer |
| Server state (mobile) | React Query | Caching, background refetch, loading/error states |
| Client state | Zustand (auth only) | Minimal — server state lives in React Query |
| Validation | Zod in both packages | Runtime safety + type inference |
| Forms | react-hook-form | Controlled forms with Zod resolver |

---

## Database Schema Overview

`api/prisma/schema.prisma` is the single source of truth.

**Models:**
- `User` — auth and ownership
- `Exercise` — seed data, read-only for users (muscleGroup, equipment)
- `WorkoutSession` — a workout event (start/end time, optional plan link)
- `WorkoutSet` — individual sets within a session (reps, weight, RPE)
- `Food` — public food library + user-created private foods
- `UserFood` — join table for user's private foods
- `MealLog` — one per meal type per day per user (breakfast/lunch/dinner/snack)
- `MealEntry` — individual food items within a meal log (with quantity in grams)
- `TrainingPlan` — a multi-week plan owned by a user
- `PlanWeek` → `PlanWorkout` → `PlannedExercise` — plan structure
- `RefreshToken` — stored hashed refresh tokens

**Key design choices:**
- `cuid()` IDs (shorter and URL-safe vs UUID)
- `PlannedExercise.reps` is a `String` (real plans say "8-12" or "AMRAP")
- `MealLog` has `@@unique([userId, date, mealType])` — one log per slot per day
- `WorkoutSession` optionally links to `PlanWorkout` for compliance tracking
- Tables use `snake_case` via `@@map`/`@map`; JSON responses use `camelCase`

---

## API Endpoints

All routes prefixed `/api/v1`. Protected routes require `Authorization: Bearer <token>`.

```
AUTH
  POST   /auth/register            Create account, return tokens
  POST   /auth/login               Login, return tokens
  POST   /auth/refresh             Exchange refresh token for new access token
  GET    /auth/me                  Current user (protected)

EXERCISES (read-only, public)
  GET    /exercises                 List all (filter: ?muscleGroup=)
  GET    /exercises/:id             Get one

WORKOUT SESSIONS (protected)
  GET    /sessions                  List (paginated, ?page=&limit=&from=&to=)
  POST   /sessions                  Start a new session
  GET    /sessions/:id              Get session with all sets
  PATCH  /sessions/:id              Update (name, endedAt, notes)
  DELETE /sessions/:id              Delete

WORKOUT SETS (protected)
  POST   /sessions/:id/sets         Add set to session
  PATCH  /sessions/:id/sets/:setId  Update set (reps, weight, completed, rpe)
  DELETE /sessions/:id/sets/:setId  Remove set

FOODS
  GET    /foods                     Search public + own private foods (?q=)
  POST   /foods                     Create private food (protected)
  GET    /foods/:id                 Get food detail
  PATCH  /foods/:id                 Update own private food (protected)
  DELETE /foods/:id                 Delete own private food (protected)

MEAL LOGS (protected)
  GET    /meals                     Logs for a date (?date=YYYY-MM-DD)
  POST   /meals                     Create/get meal log (date + mealType)
  GET    /meals/:id                 Meal log with entries + computed macros
  DELETE /meals/:id                 Delete

MEAL ENTRIES (protected)
  POST   /meals/:id/entries                   Add food entry
  PATCH  /meals/:id/entries/:entryId          Update quantity
  DELETE /meals/:id/entries/:entryId          Remove entry

NUTRITION SUMMARY (protected)
  GET    /nutrition/summary          Daily totals (?date=YYYY-MM-DD)

TRAINING PLANS (protected)
  GET    /plans                      List user's plans
  POST   /plans                      Create plan
  GET    /plans/:id                  Full plan with week/workout structure
  PATCH  /plans/:id                  Update metadata
  DELETE /plans/:id                  Delete
  POST   /plans/:id/activate         Set active (deactivates others)

PLAN STRUCTURE (protected)
  POST   /plans/:id/weeks
  POST   /plans/:id/weeks/:weekId/workouts
  PATCH  /plans/:id/weeks/:weekId/workouts/:workoutId
  DELETE /plans/:id/weeks/:weekId/workouts/:workoutId
  POST   /plans/:id/weeks/:weekId/workouts/:workoutId/exercises
```

**Response envelopes:**

List:
```json
{ "data": [...], "meta": { "page": 1, "limit": 20, "total": 143 } }
```

Single:
```json
{ "data": { ... } }
```

Error:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "email is required", "statusCode": 400 } }
```

---

## Authentication Flow

1. `POST /auth/register` or `POST /auth/login` returns:
   ```json
   { "accessToken": "...", "refreshToken": "..." }
   ```
2. Access token expires in **15 minutes**. Refresh token expires in **30 days**.
3. Mobile stores both tokens in `expo-secure-store`.
4. `api.ts` on mobile intercepts `401` responses, calls `POST /auth/refresh`, updates stored tokens, and retries the original request once.
5. Refresh tokens are stored **hashed** in the `RefreshToken` DB table. On logout or expiry they are deleted.
6. Passwords hashed with `bcrypt` (cost factor 12).

---

## Code Conventions

### TypeScript
- `strict: true` everywhere.
- No `any` — use `unknown` and narrow, or Prisma-generated types.
- API response types defined in `api/src/schemas/` and mirrored in `mobile/src/types/api.types.ts`.

### API (Fastify)
- One file per route handler. Each exports a Fastify plugin function.
- Parent `index.ts` registers child routes via `fastify.register()`.
- Request body/params validated with Fastify's built-in JSON schema.
- Database access only via `fastify.prisma` (never import `PrismaClient` in route files).
- **Never** include `passwordHash` in any response type.

### Mobile
- All screens are files under `src/app/` — no manual route config.
- `_layout.tsx` at the root reads Zustand auth state and redirects unauthenticated users to `(auth)`.
- All API calls go through `src/services/api.ts` — this is the only file that touches the base URL and auth header.
- React Query hooks live in `src/hooks/` — screens import hooks, not `api.ts` directly.
- No inline styles. Use `StyleSheet.create()` at the bottom of each file.

### Naming
| Thing | Convention |
|---|---|
| TS/JS files (non-component) | `kebab-case.ts` |
| React components | `PascalCase.tsx` |
| Hooks | `camelCase.ts` (prefixed `use`) |
| DB tables/columns | `snake_case` (via Prisma `@@map`) |
| JSON response keys | `camelCase` |
| Variables/functions | `camelCase` |
| Types/interfaces | `PascalCase` |

### Testing
- **API**: Vitest + Fastify `inject()`. Test files next to source (`sessions.test.ts`). Use a separate test database.
- **Mobile**: Jest + React Native Testing Library. Test hooks and utilities; avoid snapshot tests.

### Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- Feature branches off `main`. No direct commits to `main`.

---

## Key Files (Start Here for Each Area)

| Task | File |
|---|---|
| Add a new API route | `api/src/routes/<feature>/index.ts` |
| Change data model | `api/prisma/schema.prisma` |
| Add an API call on mobile | `mobile/src/services/api.ts` |
| Add a new screen | `mobile/src/app/<path>.tsx` |
| Change auth gate logic | `mobile/src/app/_layout.tsx` |
| Add server state to a screen | `mobile/src/hooks/use<Feature>.ts` |
| Change auth state | `mobile/src/store/auth.store.ts` |
| Add a Fastify plugin | `api/src/plugins/` + register in `api/src/app.ts` |

---

## What NOT to Do

- Do not import `PrismaClient` directly in route handlers — use `fastify.prisma`.
- Do not store tokens in `AsyncStorage` — use `expo-secure-store`.
- Do not call `api.ts` directly from screen components — go through a React Query hook.
- Do not return `passwordHash` from any endpoint — create explicit response types.
- Do not add `any` types — use Prisma-generated types or `unknown`.
- Do not put navigation logic in components — use `_layout.tsx` and Expo Router's `<Redirect>`.
- Do not add inline styles to React Native components — use `StyleSheet.create()`.

---

## Implementation Order (When Building From Scratch)

1. API foundation — Fastify app, Prisma plugin, JWT plugin, error handling
2. Database — Write and run initial migration, seed exercise library
3. Auth routes — Register, login, refresh, `/me`
4. Workout routes — Sessions and sets
5. Nutrition routes — Foods and meal logs
6. Training plan routes — Most complex, build last
7. Mobile auth screens — Login/register, token storage, API service layer
8. Mobile tab screens — Dashboard → workout logger → nutrition → plans
9. React Query hooks — Add as each screen is built
10. Polish — Loading states, error boundaries, offline handling
