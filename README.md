# Kolma AI Formulation PoC

React + NestJS + Prisma + Supabase 기반 건강기능식품 AI 배합 설계 PoC입니다.

## Apps

- `apps/web`: React/Vite frontend
- `apps/api`: NestJS backend

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev:api
npm run dev:web
```

초기 개발은 `AI_PROVIDER=mock`으로 실행할 수 있습니다. Supabase 연결 전에도 schema validate, API 테스트, 웹 화면 검증은 가능합니다.

## Environment Values

`.env`는 저장소에 커밋하지 않습니다. 필요한 값은 `.env.example`에 형식만 유지합니다.

Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

AI provider:

- `AI_PROVIDER`: `mock`, `openai`, `gemini`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Frontend:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Database

Prisma schema는 `apps/api/prisma/schema.prisma`에 있습니다.

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/kolma" \
DIRECT_URL="postgresql://user:pass@localhost:5432/kolma" \
npm --workspace apps/api run prisma:validate
```

Supabase에서 vector 검색을 사용하려면 SQL Editor에서 아래 확장을 먼저 활성화합니다.

```sql
create extension if not exists vector;
```

실제 migration은 Supabase `DATABASE_URL`, `DIRECT_URL` 입력 후 실행합니다.

```bash
npm --workspace apps/api run prisma:migrate
```

## Development Commands

```bash
npm run build:api
npm run build:web
npm run test:api
npm run test:api:e2e
npm --workspace apps/api run lint
npm --workspace apps/web run lint
npm --workspace apps/web test -- --run
```

## Deployment

Vercel frontend:

- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `dist`
- Config file: `apps/web/vercel.json`

Railway backend:

- Root directory: `apps/api`
- Build: Nixpacks default
- Start command: `npm run start:prod`
- Config file: `apps/api/railway.json`

Railway 환경변수에는 Supabase, Prisma, AI provider 값을 입력합니다. OpenAI/Gemini 키가 없으면 `AI_PROVIDER=mock`으로 시작합니다.

## Reference Documents

`docs/request/` contains local reference materials and is intentionally ignored by Git.
