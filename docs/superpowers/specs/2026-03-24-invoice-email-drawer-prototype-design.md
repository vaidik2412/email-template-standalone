# Invoice Email Drawer Prototype Design

## Goal

Build a standalone prototype in `email-template-standalone` that recreates Lydia's invoice email drawer flow:

1. A user selects a real sample invoice from Mongo.
2. The user opens an email drawer for that invoice.
3. The drawer starts with template selection instead of a prefilled static compose screen.
4. After template selection, the system resolves the template variables against the selected invoice exactly once.
5. The resolved subject and body become editable plain text/markdown content with no further variable behavior inside the drawer.

## Scope

### In scope

- A new prototype route in the standalone app dedicated to the invoice-email drawer flow
- Fetching sample invoices from the Mongo `invoices` collection for the fixed demo business
- A Lydia-style right drawer opened from an invoice list
- Template selection for email templates relevant to accounting documents
- One-time template resolution against the selected invoice
- Editable `To`, `Subject`, and `Body` fields after resolution
- Explicit controls to change template or reapply a template, even if that discards manual edits
- Prototype-only send action that does not deliver email

### Out of scope

- Replacing the current template authoring flow in `/templates`
- Live variable chips, token insertion, or variable-aware editing inside the drawer
- Real email delivery, SMTP integration, Google/Outlook identity flows
- Full parity with Lydia styling or backend contracts outside what is needed for the prototype
- Support for non-invoice document types in this first pass

## Product Rules

- Sample invoices must come from Mongo, not hardcoded fixtures.
- Template selection happens before any subject/body content is shown.
- Variable resolution runs once when a template is applied to an invoice.
- After resolution, subject/body edits are plain content edits.
- Manual edits must not preserve or re-evaluate template variables.
- Reapplying or changing the template regenerates the draft from the selected template and selected invoice, replacing manual edits.
- Missing variable mappings should remain visibly unresolved in the generated content rather than being silently removed.

## User Flow

### Entry point

Add a dedicated route such as `/prototypes/invoice-email-drawer`.

The page shows:

- a page title and short explanation
- a list of recent sample invoices for the fixed demo business
- enough invoice summary information to choose a record confidently
- an `Email invoice` action per row

### Drawer flow

When the user clicks `Email invoice`:

1. Open a right-side drawer for that invoice.
2. Show a template selection step first.
3. Let the user choose from visible `EMAIL` templates scoped to accounting documents.
4. Once a template is chosen, resolve the template against the selected invoice and move to the compose state.
5. In compose state, show:
   - invoice context summary
   - recipient fields
   - editable subject
   - editable body
   - `Change template` action
   - `Reapply template` action
   - prototype `Send` action

### Template change / reapply behavior

- `Change template` returns the user to template selection and clears the currently generated draft.
- `Reapply template` keeps the current invoice and selected template but regenerates the subject/body/to fields from source data.
- If the user has edited the draft, both actions should warn that manual edits will be lost.

## Information Architecture

## Unit 1: Prototype route page

**Responsibility:** Host the invoice list, fetch sample invoice summaries, and control which invoice drawer is open.

**Inputs:** Invoice list API response

**Outputs:** Selected invoice id and drawer open/close state

## Unit 2: Invoice email drawer shell

**Responsibility:** Render the Lydia-style drawer frame, step transitions, and footer actions.

**Inputs:** Selected invoice summary, selected template state, generated draft state

**Outputs:** Template selection events, draft edits, close action, reapply/change-template actions

## Unit 3: Template picker state

**Responsibility:** Load and display eligible templates for invoice emailing.

**Inputs:** Existing `/api/templates` data

**Outputs:** Selected template id and template payload

## Unit 4: Draft resolution service

**Responsibility:** Convert an invoice document plus selected template into a resolved draft.

**Inputs:** Invoice record, selected template

**Outputs:** Plain draft fields such as `to`, `subject`, `body`, `resolvedVariableMap`, and unresolved token info if needed for debugging or UI messaging

## Unit 5: Invoice variable mapping service

**Responsibility:** Extract template variables from a real invoice document into the value map used by the resolver.

**Inputs:** Mongo invoice document for the fixed business

**Outputs:** A `Record<string, string>` keyed like the existing accounting variables:

- `document.number`
- `document.date`
- `document.due_date`
- `document.total`
- `document.currency`
- `document.share_link`
- `customer.name`
- `customer.email`
- `customer.phone`
- `business.name`
- `business.email`
- `business.phone`
- payment-related fields when available

## Data Requirements

## Invoice list data

The invoice listing page only needs summary fields:

- invoice id
- document number
- customer name
- customer email
- issue date
- due date
- total amount
- currency
- share link if available
- status if easy to derive

## Invoice resolution data

The resolver needs the full invoice document, or at least the subset necessary to map all supported accounting variables.

If a field is not present on a given invoice:

- leave the corresponding token unresolved in generated subject/body, and
- use empty fallback only for non-template UI fields where a blank is acceptable

## Template filtering

Templates shown in the picker should be filtered to:

- `channel === 'EMAIL'`
- `templateType === 'ACCOUNTING_DOCUMENTS'`

This avoids showing CRM templates in an invoice-emailing flow.

## Interaction Details

### Before template selection

- No editable subject/body fields are shown yet.
- The primary action is selecting a template.
- The selected invoice summary remains visible in the drawer header or sidebar area.

### After template selection

- Populate the compose fields with resolved values.
- The fields become controlled draft state independent from the source template.
- No variable menu, no token chip insertion, and no dynamic re-resolution on keystroke.

### Recipients

For the prototype, default the primary recipient from invoice customer email when present.

- `To` should remain editable after resolution.
- `Cc` can be omitted in this first pass unless implementation is trivially cheap and already patterned nearby.

## Error Handling

### Invoice loading failures

- Show a page-level error state when invoices cannot be fetched.
- Keep the route usable for retry.

### Empty invoice collection

- Show an explicit empty state explaining that no sample invoices were found for the demo business.

### Template loading failures

- Keep the drawer open and show a template-step error with retry guidance.

### Resolution failures

- Show an inline drawer error and do not transition to compose state.
- The user can choose a different template or retry.

## Styling Direction

The prototype should feel clearly inspired by Lydia's email drawer:

- right-side drawer layout
- clean header with invoice context and close action
- template-selection first state
- compose layout that emphasizes generated-but-editable content

Exact Lydia parity is not required, but the interaction model should match the real flow more than the current side-by-side preview panel does.

## API / Server Additions

Add server support for:

1. Listing recent sample invoices from Mongo for the fixed demo business
2. Reading the full invoice needed for resolution
3. Resolving a selected template against that invoice into plain draft fields

The prototype may expose this either as:

- separate invoice and resolve endpoints, or
- a small set of route handlers with clear boundaries

Preferred split:

- invoice list/query endpoint
- template-application/resolve endpoint

This keeps invoice fetching and draft generation independently testable.

## Testing Strategy

### Component tests

- invoice list renders and opens the drawer
- drawer starts on template selection
- selecting a template produces resolved draft content
- resolved draft is editable
- edited content does not re-resolve variables while typing
- changing/reapplying template replaces manual edits after confirmation

### Server tests

- invoice listing returns only invoices for the fixed demo business
- invoice-to-variable-map conversion covers required accounting variables
- template resolution returns plain resolved subject/body/to values
- missing invoice values leave unresolved tokens intact

### Integration confidence

At minimum, verify:

- the new route renders
- drawer workflow works end to end with real Mongo-backed invoices
- existing template-builder routes remain unaffected

## Open Decisions Already Resolved

- Prototype location: dedicated standalone prototype route
- Invoice source: real sample invoices from Mongo
- Post-resolution editing: editable
- Variable behavior after edit: disabled; edits are static draft content
