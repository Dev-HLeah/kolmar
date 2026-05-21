# Kolma PoC RBAC Work Units

## Context

- User roles are intentionally simple for the PoC: `admin`, `researcher`, `viewer`.
- `researcher` includes the expected review-level workflow for now; there is no separate reviewer role.
- Supabase Auth will be connected later. This unit defines the API-side contract first with request headers so it is testable locally.

## Work Units

### S2. Lightweight API role access control

- Status: done
- Goal: Protect mutation endpoints while keeping read endpoints available for viewer-level access.
- Access rule:
  - `admin`: all API actions.
  - `researcher`: product/project/formula/try/test/evidence/recommendation creation actions.
  - `viewer`: read-only actions.
- Initial auth contract:
  - `x-user-role`: one of `admin`, `researcher`, `viewer`.
  - Missing role is treated as `viewer`.
- Files:
  - `apps/api/src/auth/*`
  - `apps/api/src/app.module.ts`
  - `apps/api/src/products/products.controller.ts`
  - `apps/api/src/projects/projects.controller.ts`
  - `apps/api/src/evidence/evidence.controller.ts`
  - `apps/api/src/ai/recommendation.controller.ts`
  - `apps/api/test/app.e2e-spec.ts`
- Verification:
  - `npm run test:api:e2e` passed.
  - `npm --workspace apps/api run test` passed.
  - `npm run build:api` passed.
  - `npm --workspace apps/api run lint` passed.
