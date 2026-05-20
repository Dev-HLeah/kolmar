# Kolma AI Formulation PoC

React + NestJS + Prisma + Supabase 기반 건강기능식품 AI 배합 설계 PoC입니다.

## Apps

- `apps/web`: React/Vite frontend
- `apps/api`: NestJS backend

## Local Setup

1. Copy `.env.example` to `.env`.
2. Fill Supabase and AI API keys.
3. Run `npm install`.
4. Run `npm run dev:api`.
5. Run `npm run dev:web`.

## Environment Values

Supabase values are needed for database, storage, auth, and vector search integration:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`

AI provider values are optional at first because the backend will support a mock provider during early development:

- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

## Reference Documents

`docs/request/` contains local reference materials and is intentionally ignored by Git.
