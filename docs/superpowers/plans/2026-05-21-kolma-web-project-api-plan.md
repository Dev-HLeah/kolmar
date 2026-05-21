# Kolma S9 Web Project Creation API Plan

## Context

The project creation screen currently keeps new projects only in local UI state. The service requirement is that researchers can start a new development project from an existing registered product/formula, then manage experiment groups and tries under that project. The API already supports creating projects and groups.

## Work Units

### S9. Web project creation API calls with fallback

- Status: done
- Dependencies: S2 role header, S6 manual try API alignment, S8 product registration API calls
- Parallelism: Low overlap with product registration and project detail try editing

## Scope

- Connect the project creation form to `POST /projects`.
- Create the initial experiment group with `POST /projects/:projectId/groups`.
- Preserve the current requirement that tries are not pre-created on project creation.
- Keep a local-only fallback when the API is unavailable.
- Update tests and verification notes.

## Verification

- RED: `npm --workspace apps/web test -- --run ProjectsPage.test.tsx` failed because project creation did not call the API and no fallback notice existed.
- GREEN: `npm --workspace apps/web test -- --run ProjectsPage.test.tsx` passed.
- `npm --workspace apps/web test -- --run` passed.
- `npm run build:web` passed.
- `npm --workspace apps/web run lint` passed.
- Browser render check passed at `http://127.0.0.1:4173/projects`.
