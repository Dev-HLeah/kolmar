# Kolma S16 Web Recommendation Draft Plan

## Context

The API already exposes `POST /recommendations/draft-tries`, but the web app does not let a researcher send the current formula input to the recommendation flow. The dashboard should provide a light PoC path from formula input to candidate try review.

## Work Units

### S16. Web recommendation draft try panel

- Status: done
- Dependencies: Task 11 AI recommendation API, shared formula input table
- Parallelism: Low overlap with product/project detail API work

## Scope

- Add a dashboard action that posts current formula rows to `POST /recommendations/draft-tries`.
- Include project/group name, target function, dosage form, and non-empty formula ingredients in the request.
- Render the API safety notice and candidate try cards with objective, suggested changes, and risk checks.
- Preserve PoC usability with a local fallback candidate set when the API is unavailable.
- Keep numeric formula values optional.
- Update tests and verification notes.

## Verification

- `npm --workspace apps/web test -- --run DashboardPage.test.tsx` - 2 tests passed.
- `npm --workspace apps/web test -- --run` - 23 tests passed.
- `npm run build:web` - TypeScript and Vite production build passed.
- `npm --workspace apps/web run lint` - passed.
- Browser render check: `http://127.0.0.1:4173/` showed the recommendation fallback panel after clicking `AI 후보 Try 생성` without a running backend API.
