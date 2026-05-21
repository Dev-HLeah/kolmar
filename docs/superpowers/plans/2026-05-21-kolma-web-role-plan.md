# Kolma PoC Web Role Work Units

## Context

- API RBAC now treats missing roles as `viewer`.
- The web UI needs an explicit role state so PoC users can test admin/researcher/viewer behavior before Supabase Auth is connected.
- This is a temporary local contract; Supabase Auth can later replace the role source while keeping the API header contract stable.

## Work Units

### S3. Web role selector and API role header

- Status: done
- Goal: Add a lightweight web role state and send `x-user-role` from API helpers.
- Access rule:
  - Default web role is `researcher` so the PoC remains usable for creation flows.
  - Users can switch between `admin`, `researcher`, and `viewer` from the top bar.
  - API helpers include the active role on GET and mutation requests.
- Files:
  - `apps/web/src/auth/*`
  - `apps/web/src/api/client.ts`
  - `apps/web/src/api/client.test.ts`
  - `apps/web/src/app/App.tsx`
  - `apps/web/src/app/App.test.tsx`
  - `apps/web/src/components/Layout.tsx`
  - `apps/web/src/components/Layout.css`
- Verification:
  - `npm --workspace apps/web test -- --run` passed.
  - `npm run build:web` passed.
  - `npm --workspace apps/web run lint` passed.
  - Browser check passed at `http://127.0.0.1:4173/`: role selector rendered and switched from `researcher` to `viewer`.
