# Kolma S17 Web Evidence Search Plan

## Context

The API already exposes `GET /search?q=` for structured evidence and mock vector search, but the web app has no quick reference screen for external/customer experiment evidence. Researchers need a simple search surface before Supabase and pgvector are connected.

## Work Units

### S17. Web evidence search screen

- Status: done
- Dependencies: Task 10 vector search foundation, Task 9 evidence data foundation
- Parallelism: Low overlap with project/product editing screens

## Scope

- Add a `근거 검색` navigation entry and `/knowledge` route.
- Search `GET /search?q=` from a user query.
- Support `/knowledge?q=...` as a direct search URL.
- Render result title, summary, source, grade, and match type.
- Preserve PoC usability with a local fallback result when the API is unavailable.
- Update tests and verification notes.

## Verification

- `npm --workspace apps/web test -- --run KnowledgeSearchPage.test.tsx` - 2 tests passed.
- `npm --workspace apps/web test -- --run App.test.tsx` - 1 test passed.
- `npm --workspace apps/web test -- --run` - 25 tests passed.
- `npm run build:web` - TypeScript and Vite production build passed.
- `npm --workspace apps/web run lint` - passed.
- Browser render check: `http://127.0.0.1:4173/knowledge?q=%EC%95%84%EC%97%B0` showed the local fallback evidence result when no backend API was available.
