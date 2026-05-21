# Kolma S22 Formulation Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show early dosage-form stability and Kolmar-specialized formulation guidance for a registered product.

**Architecture:** The API exposes `GET /products/:id/formulation-guidance` and derives deterministic guidance signals from dosage form, packaging, and ingredient roles. The product detail page loads this guidance independently from the product record and similar formula recommendations, preserving the product view when guidance lookup fails.

**Tech Stack:** NestJS, Prisma, React, TypeScript, Jest, Vitest.

---

## Files

- Modify: `apps/api/src/products/products.service.ts`
- Modify: `apps/api/src/products/products.controller.ts`
- Modify: `apps/api/src/products/products.service.spec.ts`
- Modify: `apps/web/src/pages/ProductDetailPage.tsx`
- Modify: `apps/web/src/pages/ProductDetailPage.test.tsx`
- Modify: `apps/web/src/pages/WorkflowPages.css`
- Create: `docs/superpowers/plans/2026-05-21-kolma-formulation-guidance-plan.md`

## Task S22: Formulation guidance

- Status: completed
- Dependencies: Product detail API lookup, Kolmar dosage form metadata
- Parallelism: Low overlap with evidence/import screens

- [x] **Step 1: Write API failing test**

Add a `ProductsService.findFormulationGuidance` test that:

- loads a `츄어블 정제` product with `Multi PTP`
- includes a formula ingredient role with `산미`
- returns Kolmar dosage form, Kolmar packaging, and taste-masking guidance signals

- [x] **Step 2: Write web failing test**

Add a `ProductDetailPage` test that:

- loads `/products/product-api-1`
- loads `/products/product-api-1/formulation-guidance`
- renders `제형 안정성 가이드`
- renders `츄어블 정제 · Multi PTP`
- renders `콜마 특화 제형` and `맛 마스킹 필요`

- [x] **Step 3: Confirm RED**

Run:

```bash
npm --workspace apps/api test -- products.service.spec.ts
npm --workspace apps/web test -- --run ProductDetailPage.test.tsx
```

Expected: API fails because `findFormulationGuidance` does not exist; web fails because the guide panel is not implemented.

- [x] **Step 4: Implement API**

Add `ProductsService.findFormulationGuidance(productId)`:

- read product with existing include
- derive dosage form and packaging names
- return summary and signals
- include Kolmar-specialized dosage form and packaging signals
- include taste masking signal when role/name suggests acid, bitterness, taste, or sensory risk

Add `ProductsController.findFormulationGuidance` at `GET /products/:id/formulation-guidance`.

- [x] **Step 5: Implement web panel**

Update `ProductDetailPage`:

- load guidance after product load
- keep formula and recommendations visible if guidance lookup fails
- show a local fallback guide and notice when the API is unavailable
- render guide signals below recommendations

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

Open `http://127.0.0.1:4173/products/sample-1` and verify the fallback product, similar formula panel, and formulation guide render without console errors.

- [x] **Step 9: Complete documentation and commit**

Update this plan status to `completed`, add verification notes, commit with:

```bash
git commit -m "feat: 제형 안정성 가이드 추가"
```

## Verification

- RED: `npm --workspace apps/api test -- products.service.spec.ts` failed because `service.findFormulationGuidance` did not exist.
- RED: `npm --workspace apps/web test -- --run ProductDetailPage.test.tsx` failed because the `제형 안정성 가이드` panel did not exist.
- GREEN: `npm --workspace apps/api test -- products.service.spec.ts`
- GREEN: `npm --workspace apps/web test -- --run ProductDetailPage.test.tsx`
- Regression: `npm --workspace apps/api run lint`
- Regression: `npm --workspace apps/web run lint`
- Regression: `npm --workspace apps/api test`
- Regression: `npm --workspace apps/web test -- --run`
- Regression: `npm run build:api`
- Regression: `npm run build:web`
- Browser: `http://127.0.0.1:4173/products/sample-1` rendered the fallback product, `유사 배합 추천`, and `제형 안정성 가이드` panels; browser console errors were empty.
