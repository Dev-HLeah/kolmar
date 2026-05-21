# Kolma S12 Web Try Mark API Plan

## Context

Meaningful tries must be persisted so they can be collected and reviewed by project. The API already supports `POST /projects/tries/:tryId/marks`, but the web project detail page currently toggles marked state only in local UI state.

## Work Units

### S12. Web try mark API calls with fallback

- Status: done
- Dependencies: S7 manual try API calls, S11 project detail API lookup
- Parallelism: Low overlap with product and project creation screens

## Scope

- Persist marking an unmarked API-backed try with `POST /projects/tries/:tryId/marks`.
- Use the `PROMISING` mark type for the current single-click meaningful mark action.
- Keep local fallback when the API is unavailable or when the try has no API id.
- Preserve the current lightweight UI and defer persistent mark removal until a delete mark API exists.
- Update tests and verification notes.

## Verification

- RED: `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx` failed because marking a try did not call the mark API or show fallback notice on mark API failure.
- GREEN: `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx` passed.
- `npm --workspace apps/web test -- --run` passed.
- `npm run build:web` passed.
- `npm --workspace apps/web run lint` passed.
- Browser interaction check passed at `http://127.0.0.1:4173/projects/sample-project`.
