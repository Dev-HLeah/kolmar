# Kolma S21 Similar Formula Recommendation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recommend similar registered formulas from a product's ingredient ratio profile.

**Architecture:** The API exposes `GET /products/:id/similar-formulas` and computes a lightweight PoC similarity score from common ingredients and ratio difference. The product detail page loads the recommendations separately from the product record, so formula detail remains usable when recommendation lookup fails.

**Tech Stack:** NestJS, Prisma, React, TypeScript, Vitest, Jest.

---

## Files

- Modify: `apps/api/src/products/products.service.ts`
- Modify: `apps/api/src/products/products.controller.ts`
- Modify: `apps/api/src/products/products.service.spec.ts`
- Modify: `apps/web/src/pages/ProductDetailPage.tsx`
- Modify: `apps/web/src/pages/ProductDetailPage.test.tsx`
- Create: `docs/superpowers/plans/2026-05-21-kolma-similar-formula-plan.md`

## Task S21: Similar formula recommendation

- Status: completed
- Dependencies: Product formula API and product detail screen
- Parallelism: Low overlap with evidence/import screens

- [x] **Step 1: Write API failing test**

Add a `ProductsService.findSimilarFormulas` test that:

- loads a target product with two ratio-based ingredients
- loads candidate products excluding the target
- returns the closest candidate first
- includes matched ingredients, similarity score, and reason

- [x] **Step 2: Write web failing test**

Add a `ProductDetailPage` test that:

- loads `/products/product-api-1`
- loads `/products/product-api-1/similar-formulas`
- renders `유사 배합 추천`
- renders product name, `유사도 98%`, reason, and matched ingredient summary

- [x] **Step 3: Confirm RED**

Run:

```bash
npm --workspace apps/api test -- products.service.spec.ts
npm --workspace apps/web test -- --run ProductDetailPage.test.tsx
```

Expected: API fails because `findSimilarFormulas` does not exist; web fails because the recommendation panel is not implemented.

- [x] **Step 4: Implement API**

Add `ProductsService.findSimilarFormulas(productId)`:

- read target product with existing include
- read up to 20 other products with the same include
- compare the first formula from each product
- score candidates from common ingredient coverage and average ratio difference
- return top 5 candidates with `productId`, `productName`, `formulaId`, `formulaVersion`, `similarityScore`, `reason`, and `matchedIngredients`

Add `ProductsController.findSimilarFormulas` at `GET /products/:id/similar-formulas`.

- [x] **Step 5: Implement web panel**

Update `ProductDetailPage`:

- load recommendations after product load
- keep the product formula visible if recommendation lookup fails
- show a local fallback recommendation and notice when the recommendation API is unavailable
- render the recommendation list below the formula table

- [x] **Step 6: Verify focused tests**

Run:

```bash
npm --workspace apps/api test -- products.service.spec.ts
npm --workspace apps/web test -- --run ProductDetailPage.test.tsx
```

Expected: focused API and web tests pass.

- [x] **Step 7: Run regression checks**

Run:

```bash
npm --workspace apps/api run lint
npm --workspace apps/web run lint
npm --workspace apps/api test
npm --workspace apps/web test -- --run
npm run build:api
npm run build:web
```

Expected: commands exit with code 0.

- [x] **Step 8: Browser check**

Open `http://127.0.0.1:4173/products/sample-1` and verify the fallback product and similar formula panel render without console errors.

- [x] **Step 9: Complete documentation and commit**

Update this plan status to `completed`, add verification notes, commit with:

```bash
git commit -m "feat: 유사 배합 추천 추가"
```

## Verification

- RED: `npm --workspace apps/api test -- products.service.spec.ts` failed because `service.findSimilarFormulas` did not exist.
- RED: `npm --workspace apps/web test -- --run ProductDetailPage.test.tsx` failed because the `유사 배합 추천` panel did not exist.
- GREEN: `npm --workspace apps/api test -- products.service.spec.ts`
- GREEN: `npm --workspace apps/web test -- --run ProductDetailPage.test.tsx`
- Regression: `npm --workspace apps/api run lint`
- Regression: `npm --workspace apps/web run lint`
- Regression: `npm --workspace apps/api test`
- Regression: `npm --workspace apps/web test -- --run`
- Regression: `npm run build:api`
- Regression: `npm run build:web`
- Browser: `http://127.0.0.1:4173/products/sample-1` rendered the fallback product and `유사 배합 추천` panel; browser console errors were empty.
