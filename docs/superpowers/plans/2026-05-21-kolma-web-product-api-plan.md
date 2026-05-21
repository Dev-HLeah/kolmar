# Kolma PoC Web Product API Work Units

## Context

- Existing product and formula registration is a core workflow.
- The products page currently stores new products only in local state.
- The API already supports `POST /products` with product metadata and formula ingredients.

## Work Units

### S8. Web product registration API calls with fallback

- Status: done
- Goal: Connect product registration to the product API while keeping the local PoC fallback.
- API flow:
  - `POST /products`
- Payload:
  - Product metadata: name, target, function, dosage form, packaging.
  - Formula metadata: default version `v1`.
  - Non-empty formula ingredients from the input table.
- UX:
  - On API success, use the returned product id.
  - On API failure, keep the local draft and show a short local-only notice.
- Files:
  - `apps/web/src/pages/ProductsPage.tsx`
  - `apps/web/src/pages/ProductsPage.test.tsx`
  - `apps/web/src/pages/WorkflowPages.css`
- Verification:
  - `npm --workspace apps/web test -- --run ProductsPage.test.tsx` passed.
  - `npm --workspace apps/web test -- --run` passed.
  - `npm run build:web` passed.
  - `npm --workspace apps/web run lint` passed.
  - Browser render check passed at `http://127.0.0.1:4173/products`.
