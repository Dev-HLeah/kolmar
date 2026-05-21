# Kolma S18 Web Evidence Registration Plan

## Context

Evidence search is now visible in the web app, but researchers still need a quick way to turn external references into reusable internal evidence records. The API already supports source and evidence item registration.

## Work Units

### S18. Web evidence source and item registration

- Status: done
- Dependencies: S17 evidence search screen, Task 9 evidence API foundation
- Parallelism: Low overlap with product/project workflows

## Scope

- Add a compact evidence registration form on the `근거 검색` screen.
- Register an evidence source with `POST /evidence/sources`.
- Register an evidence item with `POST /evidence/items` using the created source id.
- Render newly registered evidence in a reusable local list.
- Preserve PoC usability with a local fallback list when the API is unavailable.
- Keep source URL, summary, and grade optional.
- Update tests and verification notes.

## Verification

- `npm --workspace apps/web test -- --run KnowledgeSearchPage.test.tsx` - 4 tests passed.
- `npm --workspace apps/web test -- --run` - 27 tests passed.
- `npm run build:web` - TypeScript and Vite production build passed.
- `npm --workspace apps/web run lint` - passed.
- Browser render check: `http://127.0.0.1:4173/knowledge` showed the evidence registration form and registered-evidence list area.
