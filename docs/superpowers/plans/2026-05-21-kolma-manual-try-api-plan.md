# Kolma PoC Manual Try API Work Units

## Context

- Project creation must not auto-create `try#1` through `try#100`.
- Researchers should add and delete tries manually within a project group.
- The previous batch pre-list endpoint is no longer aligned with the clarified workflow.

## Work Units

### S6. Manual try API alignment

- Status: done
- Goal: Remove the batch pre-list API and add a delete endpoint for user-managed tries.
- API:
  - Keep `POST /projects/groups/:groupId/tries` for one user-created try.
  - Add `DELETE /projects/tries/:tryId` for deleting one try.
  - Remove `POST /projects/groups/:groupId/tries/batch`.
- Access:
  - `admin` and `researcher` can add/delete tries.
  - `viewer` remains read-only.
- Files:
  - `apps/api/src/projects/projects.controller.ts`
  - `apps/api/src/projects/projects.service.ts`
  - `apps/api/src/projects/projects.service.spec.ts`
  - `apps/api/src/projects/dto/create-formula-try-batch.dto.ts`
  - `docs/superpowers/plans/2026-05-21-kolma-try-batch-plan.md`
- Verification:
  - `npm --workspace apps/api run test -- projects.service.spec.ts` passed.
  - `npm --workspace apps/api run test` passed.
  - `npm run test:api:e2e` passed.
  - `npm run build:api` passed.
  - `npm --workspace apps/api run lint` passed.
