# WhatsApp Server Boundary

This directory owns WhatsApp-provider-facing server contracts.

## Current Scope

- `submission.ts` builds a canonical, provider-agnostic payload for the supported subset and runs publish-time validation.
- `../aisensy/translateTemplate.ts` translates that subset into AiSensy's flat shape (positional placeholders, `[bracketed]` sample text, decomposed CTA URLs); `../aisensy/client.ts` posts to AiSensy's Project API and reads template status.
- Supported subset: text body, optional text header, optional plain footer, and one URL button.
- The builder converts saved Refrens variable names like `{{customer.name}}` into WhatsApp positional placeholders like `{{1}}` and carries the source variable keys + sample values so adapters never re-parse template text.

## Publish Validation

`src/server/templates/service.ts` calls the submission validator only on the publish path — drafts may stay incomplete:

- WhatsApp publish must satisfy hard component limits (header 60, footer 60, body 1024, button label 20).
- Variables must come from the active template-type catalog; unsupported placeholders are rejected.
- Footer variables are disallowed; header and URL button each allow at most one variable.
- `name` must already be a WhatsApp-safe slug (lowercase letters, digits, underscores) — `src/utils/whatsappTemplateName.ts` provides the helpers used by the form.
- Validation failures surface as `TemplatePayloadValidationError` (HTTP 400) so the form shows them inline.

## Known Future Extensions

- Quick reply, phone, copy-code, flow, and authentication button models.
- Media headers and richer formats (carousel, limited-time offer, etc.).
- Webhook-driven status updates instead of the current pull-on-demand `Check Status` flow.
