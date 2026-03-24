# Invoice Email Drawer Prototype Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated standalone prototype route that lets users pick a Mongo-backed sample invoice, choose an email template, resolve it once against that invoice, and then edit the generated draft as plain static content inside a Lydia-style drawer.

**Architecture:** Keep the current template authoring experience unchanged and add a separate prototype surface at `/prototypes/invoice-email-drawer`. Split the work into a small server layer for invoice listing and template-to-draft resolution, plus a client-side drawer experience that loads templates, applies one-time resolution, and manages post-resolution draft edits locally.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, Mongoose, existing standalone templates API

---

## Chunk 1: Server Foundations

### Task 1: Add server-side types and invoice query helpers

**Files:**
- Create: `src/server/invoiceEmailDrawer/types.ts`
- Create: `src/server/invoiceEmailDrawer/invoices.ts`
- Modify: `src/server/constants/fixedContext.ts` (only if the invoice helper needs exported shared ids already present)
- Test: `src/server/invoiceEmailDrawer/__tests__/invoices.test.ts`

- [ ] **Step 1: Write the failing server test**

Add tests that describe:
- invoice summaries are filtered to the fixed demo business
- summaries normalize the fields the UI needs
- empty/partial invoice documents still produce safe summary output

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- src/server/invoiceEmailDrawer/__tests__/invoices.test.ts`
Expected: FAIL because the new invoice helper does not exist yet.

- [ ] **Step 3: Implement the minimal invoice helper**

Create `src/server/invoiceEmailDrawer/invoices.ts` with:
- a `listSampleInvoices()` function that connects via `connectToDatabase()`
- a direct `db.collection('invoices')` query scoped to `FIXED_APP_CONTEXT.business.id`
- normalization into a summary shape like `id`, `number`, `customerName`, `customerEmail`, `issueDate`, `dueDate`, `currency`, `total`, `status`
- guarded property reads so the prototype survives schema variation

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- src/server/invoiceEmailDrawer/__tests__/invoices.test.ts`
Expected: PASS.

### Task 2: Add template-resolution helpers for invoice drafts

**Files:**
- Create: `src/server/invoiceEmailDrawer/resolveDraft.ts`
- Modify: `src/server/invoiceEmailDrawer/types.ts`
- Test: `src/server/invoiceEmailDrawer/__tests__/resolveDraft.test.ts`

- [ ] **Step 1: Write the failing resolution test**

Add tests that describe:
- template subject/body resolve against invoice-backed variables
- unresolved tokens remain visible when a value is missing
- recipient defaults come from the selected invoice

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- src/server/invoiceEmailDrawer/__tests__/resolveDraft.test.ts`
Expected: FAIL because the resolver does not exist yet.

- [ ] **Step 3: Implement the minimal resolver**

Create:
- a token-replacement helper using the existing `{{token}}` format
- invoice-to-variable-map normalization for keys like `document.number`, `document.date`, `document.due_date`, `document.total`, `document.currency`, `document.share_link`, `customer.name`, `customer.email`, and `business.*`
- an `applyTemplateToInvoice()` function that returns a plain draft payload with `to`, `subject`, and `body`

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- src/server/invoiceEmailDrawer/__tests__/resolveDraft.test.ts`
Expected: PASS.

## Chunk 2: API Routes

### Task 3: Expose invoice summaries through a dedicated prototype API route

**Files:**
- Create: `app/api/prototypes/invoice-email-drawer/invoices/route.ts`
- Create: `app/api/prototypes/invoice-email-drawer/invoices/__tests__/route.test.ts`
- Modify: `src/server/invoiceEmailDrawer/invoices.ts`

- [ ] **Step 1: Write the failing route test**

Cover:
- success response with invoice data
- JSON error response when invoice loading fails

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- app/api/prototypes/invoice-email-drawer/invoices/__tests__/route.test.ts`
Expected: FAIL because the route does not exist yet.

- [ ] **Step 3: Implement the route**

Create a GET route that calls `listSampleInvoices()` and returns a stable JSON payload.

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- app/api/prototypes/invoice-email-drawer/invoices/__tests__/route.test.ts`
Expected: PASS.

### Task 4: Expose draft resolution through a dedicated prototype API route

**Files:**
- Create: `app/api/prototypes/invoice-email-drawer/draft/route.ts`
- Create: `app/api/prototypes/invoice-email-drawer/draft/__tests__/route.test.ts`
- Modify: `src/server/invoiceEmailDrawer/invoices.ts`
- Modify: `src/server/invoiceEmailDrawer/resolveDraft.ts`

- [ ] **Step 1: Write the failing route test**

Cover:
- POST resolves a selected template id and invoice id into a draft
- invalid request payload returns a JSON error
- server failures return an error payload

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- app/api/prototypes/invoice-email-drawer/draft/__tests__/route.test.ts`
Expected: FAIL because the route does not exist yet.

- [ ] **Step 3: Implement the draft route**

Create a POST route that:
- accepts `invoiceId` and `templateId`
- loads the template using existing template service/model access
- loads the selected invoice
- returns a plain resolved draft payload

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- app/api/prototypes/invoice-email-drawer/draft/__tests__/route.test.ts`
Expected: PASS.

## Chunk 3: Prototype UI

### Task 5: Create the prototype route and invoice list shell

**Files:**
- Create: `app/prototypes/invoice-email-drawer/page.tsx`
- Create: `src/components/prototypes/invoiceEmailDrawer/InvoiceEmailDrawerPrototypePage.tsx`
- Create: `src/components/prototypes/invoiceEmailDrawer/InvoiceEmailDrawerPrototype.module.css`
- Create: `src/components/prototypes/invoiceEmailDrawer/__tests__/InvoiceEmailDrawerPrototypePage.test.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the failing component test**

Cover:
- the prototype page loads invoice rows
- clicking `Email invoice` opens the drawer
- the drawer starts in template-selection mode

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- src/components/prototypes/invoiceEmailDrawer/__tests__/InvoiceEmailDrawerPrototypePage.test.tsx`
Expected: FAIL because the page and components do not exist yet.

- [ ] **Step 3: Implement the invoice list shell**

Create a client component that:
- fetches invoice summaries from the new prototype invoices API
- renders loading, empty, and error states
- opens a right-side drawer for the selected invoice
- adds a discoverable entry point from the home page

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- src/components/prototypes/invoiceEmailDrawer/__tests__/InvoiceEmailDrawerPrototypePage.test.tsx`
Expected: PASS for the invoice list and initial drawer state.

### Task 6: Add template selection and one-time draft generation

**Files:**
- Modify: `src/components/prototypes/invoiceEmailDrawer/InvoiceEmailDrawerPrototypePage.tsx`
- Modify: `src/components/prototypes/invoiceEmailDrawer/InvoiceEmailDrawerPrototype.module.css`
- Modify: `src/components/prototypes/invoiceEmailDrawer/__tests__/InvoiceEmailDrawerPrototypePage.test.tsx`

- [ ] **Step 1: Extend the failing component test**

Cover:
- only invoice-email templates appear in the selection step
- selecting a template calls the draft API
- the drawer transitions into compose mode with resolved values

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- src/components/prototypes/invoiceEmailDrawer/__tests__/InvoiceEmailDrawerPrototypePage.test.tsx`
Expected: FAIL because template selection and draft generation are not implemented yet.

- [ ] **Step 3: Implement the template-step flow**

Add client logic that:
- fetches existing templates through `/api/templates`
- filters to `channel === 'EMAIL'` and `templateType === 'ACCOUNTING_DOCUMENTS'`
- calls the draft route after template selection
- stores the returned draft separately from source template state

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- src/components/prototypes/invoiceEmailDrawer/__tests__/InvoiceEmailDrawerPrototypePage.test.tsx`
Expected: PASS for template selection and draft generation.

### Task 7: Add editable compose mode with static post-resolution behavior

**Files:**
- Modify: `src/components/prototypes/invoiceEmailDrawer/InvoiceEmailDrawerPrototypePage.tsx`
- Modify: `src/components/prototypes/invoiceEmailDrawer/InvoiceEmailDrawerPrototype.module.css`
- Modify: `src/components/prototypes/invoiceEmailDrawer/__tests__/InvoiceEmailDrawerPrototypePage.test.tsx`

- [ ] **Step 1: Extend the failing component test**

Cover:
- `To`, `Subject`, and `Body` are editable after resolution
- typing into subject/body leaves resolved text static
- `Change template` and `Reapply template` warn before discarding edits
- confirming reapply regenerates the draft

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `npm test -- src/components/prototypes/invoiceEmailDrawer/__tests__/InvoiceEmailDrawerPrototypePage.test.tsx`
Expected: FAIL because compose-mode editing and reapply behavior are not implemented yet.

- [ ] **Step 3: Implement compose-mode state**

Add local draft state and confirm/discard behavior so:
- edits never trigger variable re-resolution
- reapply/change-template replace manual edits only after confirmation
- send remains a prototype-only action

- [ ] **Step 4: Re-run the targeted test**

Run: `npm test -- src/components/prototypes/invoiceEmailDrawer/__tests__/InvoiceEmailDrawerPrototypePage.test.tsx`
Expected: PASS.

## Chunk 4: End-to-End Verification

### Task 8: Run focused verification

**Files:**
- Modify: `app/prototypes/invoice-email-drawer/page.tsx`
- Modify: `src/components/prototypes/invoiceEmailDrawer/InvoiceEmailDrawerPrototypePage.tsx`
- Modify: `src/server/invoiceEmailDrawer/invoices.ts`
- Modify: `src/server/invoiceEmailDrawer/resolveDraft.ts`

- [ ] **Step 1: Run prototype-focused tests**

Run: `npm test -- invoiceEmailDrawer`
Expected: PASS for the new prototype server and UI tests.

- [ ] **Step 2: Run broader route/component coverage**

Run: `npm test -- app/api src/components/prototypes`
Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS.
