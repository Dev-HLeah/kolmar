# Kolma S11 Web Project Detail API Plan

## Context

The project detail page currently renders a static sample project and posts new tries to `sample-group`. After project creation was connected to the API, this breaks the path from a created project into its actual experiment group and try list.

## Work Units

### S11. Web project detail API lookup with dynamic group id

- Status: done
- Dependencies: S7 manual try API calls, S9 project creation API calls
- Parallelism: Low overlap with product detail lookup

## Scope

- Load project detail data from `GET /projects/:projectId`.
- Render project name, first experiment group, and API tries.
- Derive the active group id from the loaded project and use it for manual try creation.
- Preserve local marking behavior for now.
- Keep a sample fallback when the API is unavailable.
- Update tests and verification notes.

## Verification

- RED: `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx` failed because the detail page did not load API data or use the loaded group id.
- GREEN: `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx` passed.
- `npm --workspace apps/web test -- --run` passed.
- `npm run build:web` passed.
- `npm --workspace apps/web run lint` passed.
- Browser render check passed at `http://127.0.0.1:4173/projects/sample-project`.
