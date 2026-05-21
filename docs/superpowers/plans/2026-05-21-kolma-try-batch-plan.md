# Kolma PoC Try Batch Work Units

## Context

- Product development can require many planned trials before researchers begin lab work.
- The PoC already supports a single formula try, but it does not yet provide a direct way to pre-list `try#1` through `try#100`.
- Try detail fields remain optional. The important required inputs for batch creation are the experiment group and the desired count.

## Work Units

### S4. Formula try batch pre-listing API

- Status: done
- Goal: Add an API endpoint that creates a contiguous list of planned tries for an experiment group.
- API:
  - `POST /projects/groups/:groupId/tries/batch`
  - Body:
    - `count`: number of tries to create.
    - `startNumber`: optional, defaults to `1`.
    - `status`: optional, defaults to `PLANNED`.
    - `titlePrefix`, `dosageForm`, `manufacturingProcess`, `memo`: optional common values.
  - Constraint:
    - `count` must be between 1 and 200.
- Output:
  - Created try records in sequence order.
- Files:
  - `apps/api/src/projects/dto/create-formula-try-batch.dto.ts`
  - `apps/api/src/projects/projects.service.ts`
  - `apps/api/src/projects/projects.service.spec.ts`
  - `apps/api/src/projects/projects.controller.ts`
- Verification:
  - `npm --workspace apps/api run test -- projects.service.spec.ts` passed.
  - `npm --workspace apps/api run test` passed.
  - `npm run test:api:e2e` passed.
  - `npm run build:api` passed.
  - `npm --workspace apps/api run lint` passed.
