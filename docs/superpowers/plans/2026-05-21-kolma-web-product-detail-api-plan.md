# Kolma S10 Web Product Detail API Plan

## Context

Existing product and formula information must be registered and viewed as a reusable R&D asset. The product detail page currently shows only a static sample formulation even when the route contains a product id. The products API already exposes `GET /products/:id`.

## Work Units

### S10. Web product detail API lookup with fallback

- Status: done
- Dependencies: S8 product registration API calls
- Parallelism: Low overlap with project detail try editing

## Scope

- Load product detail data from `GET /products/:productId`.
- Render product name, function, dosage form, packaging, and first formula ingredients.
- Keep a sample fallback when the API is unavailable.
- Preserve optional formula values as editable table values without forcing required fields.
- Update tests and verification notes.

## Verification

- RED: `npm --workspace apps/web test -- --run ProductDetailPage.test.tsx` failed because the detail page did not call the API or render a fallback notice.
- GREEN: `npm --workspace apps/web test -- --run ProductDetailPage.test.tsx` passed.
- `npm --workspace apps/web test -- --run` passed.
- `npm run build:web` passed.
- `npm --workspace apps/web run lint` passed.
- Browser render check passed at `http://127.0.0.1:4173/products/sample-1`.
