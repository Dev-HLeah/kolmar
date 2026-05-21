# Kolma S20 Voice Input Draft UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight voice input draft UX to the shared formula input table without implementing speech recognition.

**Architecture:** `FormulaInputTable` owns a local panel toggle and renders a read-only draft workflow. The panel documents the capture, parsing, and researcher confirmation steps, while keeping actual formula row persistence unchanged.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS.

---

## Files

- Modify: `apps/web/src/components/FormulaInputTable.tsx`
- Modify: `apps/web/src/components/FormulaInputTable.css`
- Modify: `apps/web/src/components/FormulaInputTable.test.tsx`
- Create: `docs/superpowers/plans/2026-05-21-kolma-voice-input-draft-plan.md`

## Task S20: Voice input draft UX

- Status: completed
- Dependencies: Shared formula input table from Task 4
- Parallelism: Low overlap with API and evidence screens

- [x] **Step 1: Write the failing test**

Add a test in `apps/web/src/components/FormulaInputTable.test.tsx` that clicks `음성 입력` and expects:

- heading `음성 입력 초안`
- example transcript `테아닌 200 밀리그램, 아연 8 밀리그램 추가`
- draft field labels `원료명`, `함량`, `단위`, `상태`
- notice `연구자가 확인한 뒤 배합표에 반영됩니다.`

- [x] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm --workspace apps/web test -- --run FormulaInputTable.test.tsx
```

Expected: the new test fails because the voice draft panel does not exist yet.

- [x] **Step 3: Implement the panel**

Update `FormulaInputTable.tsx`:

- Enable the `음성 입력` button.
- Toggle local `isVoicePanelOpen` state.
- Render a compact panel with the transcript example and parsed draft rows.
- Keep draft rows read-only and do not call `onChange`.

- [x] **Step 4: Style the panel**

Update `FormulaInputTable.css`:

- Add `.voice-draft-panel`.
- Add `.voice-draft-grid`.
- Keep styling neutral and consistent with the existing table.

- [x] **Step 5: Verify GREEN**

Run:

```bash
npm --workspace apps/web test -- --run FormulaInputTable.test.tsx
```

Expected: all `FormulaInputTable` tests pass.

- [x] **Step 6: Run regression checks**

Run:

```bash
npm --workspace apps/web run lint
npm --workspace apps/web test -- --run
npm run build:web
```

Expected: commands exit with code 0.

- [x] **Step 7: Browser check**

Open `http://127.0.0.1:4173/`, click `음성 입력`, and verify the panel renders without console errors. Screenshot capture was attempted at `/private/tmp/kolma-voice-input-draft-ui.png`, but the browser runtime timed out on `Page.captureScreenshot`; DOM and console verification were completed.

- [x] **Step 8: Complete documentation and commit**

Update this plan status to `completed`, add verification notes, commit with:

```bash
git commit -m "feat(web): 음성 입력 초안 설계 UI 추가"
```

## Verification

- RED: `npm --workspace apps/web test -- --run FormulaInputTable.test.tsx` failed before implementation because the `음성 입력 초안` region did not exist.
- GREEN: `npm --workspace apps/web test -- --run FormulaInputTable.test.tsx`
- Regression: `npm --workspace apps/web run lint`
- Regression: `npm --workspace apps/web test -- --run`
- Regression: `npm run build:web`
- Browser: `http://127.0.0.1:4173/` rendered the voice draft panel after clicking `음성 입력`; browser console errors were empty.
