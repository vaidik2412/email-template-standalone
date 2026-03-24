# WhatsApp Preview Figma Shell Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the WhatsApp preview into a Figma-inspired iPhone shell while keeping the user's resolved message content in one dynamic template card.

**Architecture:** Keep the current preview model and card-oriented rendering logic in `TemplateWhatsappPreview.tsx`, but replace the surrounding phone shell markup and CSS tokens with a closer Figma-inspired structure. Verify the visual contract through focused component tests that still center on live content, empty state, and CTA rendering.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, global CSS

---

## Chunk 1: Preview Contract

### Task 1: Capture the new shell expectations in tests

**Files:**
- Modify: `src/components/templates/__tests__/TemplateWhatsappPreview.test.tsx`

- [ ] **Step 1: Write the failing test**

Add assertions for the Figma-inspired shell details that should exist after the redesign while preserving the single-card content behavior.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- TemplateWhatsappPreview`
Expected: FAIL because the current preview markup still reflects the older shell.

### Task 2: Update the component structure

**Files:**
- Modify: `src/components/templates/TemplateWhatsappPreview.tsx`

- [ ] **Step 1: Implement the minimal markup changes**

Replace the old shell/header/composer structure with the Figma-inspired layout while keeping one template card for all resolved content.

- [ ] **Step 2: Run targeted tests**

Run: `npm test -- TemplateWhatsappPreview`
Expected: PASS for the updated structure and preserved content behavior.

## Chunk 2: Styling

### Task 3: Apply the Figma-inspired styling

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Restyle the preview shell**

Update the WhatsApp preview CSS to match the new iPhone frame, header, wallpaper, message card, composer bar, and home indicator.

- [ ] **Step 2: Re-run targeted tests**

Run: `npm test -- TemplateWhatsappPreview`
Expected: PASS with the component still rendering the same dynamic content contract.

### Task 4: Final verification

**Files:**
- Modify: `src/components/templates/TemplateWhatsappPreview.tsx`
- Modify: `src/components/templates/__tests__/TemplateWhatsappPreview.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Run the focused test file**

Run: `npm test -- TemplateWhatsappPreview`
Expected: PASS.

- [ ] **Step 2: Run a broader template test slice if available**

Run: `npm test -- templates`
Expected: PASS or a clear report of any unrelated failures.
