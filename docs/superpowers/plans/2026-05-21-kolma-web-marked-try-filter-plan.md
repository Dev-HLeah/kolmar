# Kolma S13 Web Marked Try Filter Plan

## Context

Researchers need to mark meaningful tries and review them by project. Mark persistence is connected, but the project detail screen still shows all tries in one table with no quick marked-only view.

## Work Units

### S13. Web marked try project view

- Status: done
- Dependencies: S11 project detail API lookup, S12 try mark API calls
- Parallelism: Low overlap with product screens

## Scope

- Add an all/marked-only view toggle to the project detail try table.
- Filter the displayed rows to marked tries when the marked-only view is active.
- Keep try counts and local mark updates reactive.
- Add a simple empty state for projects with no marked tries.
- Update tests and verification notes.

## Verification

- RED: `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx` failed because the marked-only filter controls did not exist.
- GREEN: `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx` passed.
- `npm --workspace apps/web test -- --run` passed.
- `npm run build:web` passed.
- `npm --workspace apps/web run lint` passed.
- Browser interaction check passed at `http://127.0.0.1:4173/projects/sample-project`.
