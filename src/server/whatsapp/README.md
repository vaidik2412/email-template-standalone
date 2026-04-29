# WhatsApp Server Boundary

This directory owns WhatsApp-provider-facing server contracts.

## Current Scope

- `submission.ts` builds the canonical internal submission payload for the supported subset.
- Supported subset: text body, optional text header, optional plain footer, and one URL button.
- The builder converts saved Refrens variable names like `{{customer.name}}` into WhatsApp positional placeholders like `{{1}}`.
- It also carries source variable keys and sample values so provider adapters can build Meta/AiSensy payloads without re-parsing template text.

## Publish Validation

`src/server/templates/service.ts` calls the submission builder only when publishing a WhatsApp template.

- Draft saves can remain incomplete.
- Publish attempts must satisfy hard WhatsApp/AiSensy constraints.
- Submission validation errors are converted to the existing `TemplatePayloadValidationError` 400 path.

## Known Future Extensions

- Provider-specific adapter for AiSensy template submission.
- Approval status sync separate from local `DRAFT` / `LIVE`.
- Quick reply, phone, copy-code, flow, and authentication button models.
- Media headers and advanced formats such as carousel or limited-time offer templates.
