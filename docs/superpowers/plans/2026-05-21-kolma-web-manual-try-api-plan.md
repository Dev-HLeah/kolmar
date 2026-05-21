# Kolma PoC Web Manual Try API Work Units

## Context

- The API now supports one-at-a-time try creation and deletion.
- The project detail screen supports manual try add/delete in local state.
- The web screen should call the API contract while still allowing local fallback before Supabase/DB is configured.

## Work Units

### S7. Web manual try API calls with fallback

- Status: done
- Goal: Connect project detail try add/delete actions to the manual try API contract.
- API flow:
  - Add: `POST /projects/groups/:groupId/tries`
  - Delete: `DELETE /projects/tries/:tryId`
- UX:
  - On API success, use the returned try id for later deletion.
  - On API failure, keep the local UI action and show a short local-only notice.
- Files:
  - `apps/web/src/api/client.ts`
  - `apps/web/src/api/client.test.ts`
  - `apps/web/src/pages/ProjectDetailPage.tsx`
  - `apps/web/src/pages/ProjectDetailPage.test.tsx`
  - `apps/web/src/pages/WorkflowPages.css`
- Verification:
  - `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx client.test.ts` passed.
  - `npm --workspace apps/web test -- --run` passed.
  - `npm run build:web` passed.
  - `npm --workspace apps/web run lint` passed.
  - Browser render check passed at `http://127.0.0.1:4173/projects/sample-project`. Direct text entry in the browser automation was blocked by the virtual clipboard, so add/delete behavior is covered by the automated UI tests.
