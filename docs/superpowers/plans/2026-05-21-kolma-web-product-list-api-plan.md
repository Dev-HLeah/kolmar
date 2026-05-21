# Kolma S15 Web Product List API Plan

## Context

Existing product and formula information must be reusable internal assets. Product creation and product detail lookup are connected to the API, but the product list still starts from only a local seed and does not load registered products from `GET /products`.

## Work Units

### S15. Web product list API lookup with fallback

- Status: done
- Dependencies: S8 product registration API calls, S10 product detail API lookup
- Parallelism: Low overlap with project detail screens

## Scope

- Load registered products from `GET /products` on the product list page.
- Map API products into the existing product table rows.
- Preserve the seeded sample product as fallback when the API is unavailable.
- Keep product registration behavior and local creation fallback unchanged.
- Update tests and verification notes.

## Verification

- `npm --workspace apps/web test -- --run ProductsPage.test.tsx` - 4 tests passed.
- `npm --workspace apps/web test -- --run` - 21 tests passed.
- `npm run build:web` - TypeScript and Vite production build passed.
- `npm --workspace apps/web run lint` - passed.
- Browser render check: `http://127.0.0.1:4173/products` showed the fallback product list and API fallback notice when no backend API was available.
