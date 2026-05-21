# Kolma PoC Manual Try List Work Units

## Context

- Project creation must not automatically prefill `try#1` through `try#100`.
- Researchers should manage tries inside a project/group by adding and deleting rows as the experiment plan changes.
- Existing try fields remain optional. A try can exist with only its number and an optional title/purpose.

## Work Units

### S5. Manual try add/delete UI

- Status: done
- Goal: Make the project detail screen support user-driven try list changes.
- UX:
  - Add a try from the project detail group panel.
  - Delete a try from the same list.
  - Keep try numbering predictable by assigning the next highest number on add.
  - Keep meaningful try marking behavior.
- Scope:
  - Web local-state behavior for the PoC screen.
  - Do not auto-create tries during project creation.
- Files:
  - `apps/web/src/pages/ProjectDetailPage.tsx`
  - `apps/web/src/pages/ProjectDetailPage.test.tsx`
  - `apps/web/src/pages/ProjectsPage.tsx`
  - `docs/superpowers/plans/2026-05-21-kolma-manual-try-list-plan.md`
- Verification:
  - `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx ProjectsPage.test.tsx` passed.
  - `npm --workspace apps/web test -- --run` passed.
  - `npm run build:web` passed.
  - `npm --workspace apps/web run lint` passed.
  - Browser check passed at `http://127.0.0.1:4173/projects/sample-project`: manual try add and delete worked.
