# WhatsApp Submission Contract Todo

## Plan

- [x] Add failing tests for canonical WhatsApp submission payload and validation.
- [x] Implement submission payload builder for the supported WhatsApp subset.
- [x] Implement submission-safe validation for hard WhatsApp/AiSensy failures.
- [x] Run targeted tests and full test suite.
- [x] Review diff and document outcome.

## Review

- Added `src/server/whatsapp/submission.ts` as the canonical supported-subset submission boundary.
- Added validation for publish-time hard failures: unsafe template name, missing category/language/body, body/header/footer/button limits, footer variables, too many header/button variables, CTA tokens in WhatsApp body, and unsupported variable keys.
- Built canonical components for text header, body, footer, and URL button using positional placeholders plus example values from the existing variable catalog.
- Wired WhatsApp publish paths in `src/server/templates/service.ts` through the submission builder while preserving draft saves.
- Verified with targeted tests, full `npm test`, and `npm run build`.

## WhatsApp Name UX Plan

- [x] Add failing tests for WhatsApp template-name normalization.
- [x] Implement shared normalization/validation helper.
- [x] Wire WhatsApp create/edit form name input to normalize names before publish.
- [x] Add visible helper copy for WhatsApp-safe names.
- [x] Run targeted tests, full test suite, and build.
- [x] Review diff and document outcome.

## WhatsApp Name UX Review

- Added `src/utils/whatsappTemplateName.ts` for shared WhatsApp-safe name normalization and checks.
- WhatsApp template names now normalize in the create/edit form, including pasted names, loaded legacy names, duplicate names, channel switches, and AI-generated names.
- Fixed the follow-up typing regression by preserving in-progress trailing underscores during live input normalization.
- Added visible helper copy under the template name field in WhatsApp mode.
- Added client-side validation for any legacy unsafe WhatsApp name that somehow reaches submit.
- Added regression coverage for typing a trailing underscore before finishing the template name.
- Verified with targeted tests, full `npm test`, and `npm run build`.
