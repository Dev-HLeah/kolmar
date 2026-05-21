# Kolma S19 Web Import Job Tracking Plan

## Context

External data should be saved and reused instead of being treated as one-off lookup results. The API can create import jobs, but there is no list endpoint and the web app has no way to record or inspect import collection status.

## Work Units

### S19. External data import job tracking

- Status: completed
- Dependencies: Task 9 evidence import foundation, S17/S18 evidence screens
- Parallelism: Low overlap with project/product workflows

## Scope

- Add an API list endpoint for `GET /evidence/import-jobs`.
- Render import job status on the `근거 검색` screen.
- Add a compact import job form with source name, status, message, raw external id, raw source URL, and optional raw JSON payload.
- Create jobs through `POST /evidence/import-jobs`.
- Preserve PoC usability with a local fallback job when the API is unavailable.
- Keep Supabase connection optional for this step.
- Update tests and verification notes.

## Verification

- `npm --workspace apps/api test -- evidence.service.spec.ts`
- `npm --workspace apps/web test -- --run KnowledgeSearchPage.test.tsx`
- `npm --workspace apps/api run lint`
- `npm --workspace apps/web run lint`
- `npm --workspace apps/api test`
- `npm --workspace apps/web test -- --run`
- `npm run build:api`
- `npm run build:web`
- Browser check: `http://127.0.0.1:4173/knowledge`, screenshot saved to `/private/tmp/kolma-import-job-ui.png`.
