# Kolma S14 Web Test Result API Plan

## Context

Try-level test results are core project records. The backend already supports `POST /projects/tries/:tryId/test-results`, but the project detail UI does not yet let researchers submit measured results for a selected try.

## Work Units

### S14. Web try test result API calls with fallback

- Status: done
- Dependencies: S11 project detail API lookup
- Parallelism: Low overlap with product screens and marked try filtering

## Scope

- Add a compact test result form to the project detail page.
- Let the researcher select a try and enter optional measured item, measured value, unit, judgment, and memo.
- Submit to `POST /projects/tries/:tryId/test-results` when the selected try has an API id.
- Keep local fallback messaging when the API is unavailable or the selected try is local-only.
- Update tests and verification notes.

## Verification

- RED: `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx` failed because the test result form and API call did not exist.
- GREEN: `npm --workspace apps/web test -- --run ProjectDetailPage.test.tsx` passed.
- `npm --workspace apps/web run lint` passed.
- `npm --workspace apps/web test -- --run` passed.
- `npm run build:web` passed.
- Browser render check passed at `http://127.0.0.1:4173/projects/sample-project`.
- Browser input automation could not use `fill` because the in-app browser virtual clipboard was unavailable; form submission behavior is covered by the automated page test.
