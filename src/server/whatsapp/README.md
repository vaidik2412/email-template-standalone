# WhatsApp Server Boundary

This directory owns WhatsApp-provider-facing server contracts.

## Current Scope

- `submission.ts` builds the canonical internal submission payload for the supported subset.
- `../aisensy/templateClient.ts` sends that payload to AiSensy and fetches approval status when the env gate is enabled.
- Supported subset: text body, optional text header, optional plain footer, and one URL button.
- The builder converts saved Refrens variable names like `{{customer.name}}` into WhatsApp positional placeholders like `{{1}}`.
- It also carries source variable keys and sample values so provider adapters can build Meta/AiSensy payloads without re-parsing template text.

## Publish Validation

`src/server/templates/service.ts` calls the submission builder only when publishing a WhatsApp template.

- Draft saves can remain incomplete.
- Publish attempts must satisfy hard WhatsApp/AiSensy constraints.
- Submission validation errors are converted to the existing `TemplatePayloadValidationError` 400 path.
- AiSensy calls are gated by `AISENSY_TEMPLATE_API_ENABLED=true` plus `AISENSY_PROJECT_API_KEY`, `AISENSY_TEMPLATE_CREATE_URL`, and `AISENSY_TEMPLATE_STATUS_URL`.
- Status sync is manual through `POST /api/templates/[id]/whatsapp/status` and updates `whatsapp.status` plus `lastSyncedAt`.

## Known Future Extensions

- Quick reply, phone, copy-code, flow, and authentication button models.
- Media headers and advanced formats such as carousel or limited-time offer templates.
- Webhook-driven approval updates instead of manual sync.
