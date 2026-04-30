# 2026-04-30 AiSensy Template API Integration

## Context

Implemented the WhatsApp template publish flow against AiSensy for the standalone email-template prototype.

## What Changed

- Added env-gated AiSensy config:
  - `AISENSY_TEMPLATE_API_ENABLED`
  - `AISENSY_PROJECT_API_KEY`
  - `AISENSY_TEMPLATE_CREATE_URL`
  - `AISENSY_TEMPLATE_STATUS_URL`
- Added `src/server/aisensy/templateClient.ts` for template submission and status sync.
- Wired WhatsApp publish in `src/server/templates/service.ts` to:
  - validate locally first,
  - submit the canonical WhatsApp payload to AiSensy only when the env gate is enabled,
  - store provider template id/name, approval status, `lastSubmittedAt`, `lastSyncedAt`, and submission error metadata.
- Added `POST /api/templates/[id]/whatsapp/status` for manual approval status sync.
- Added UI status surface in `TemplateFormScreen.tsx`:
  - shows `AiSensy approval: <status>` for submitted WhatsApp templates,
  - adds `Sync status`,
  - shows an `AiSensy not configured` notice when the env gate is off.
- Updated `src/server/whatsapp/README.md` and `plans/todo.md`.

## Verification

- `npm test` passed: 30 test files, 134 tests.
- `npm run build` passed locally.
- Vercel preview deployment built successfully.

## Deployment

- Preview URL: https://email-template-standalone-rolnfyoy4-vaidik2412s-projects.vercel.app
- Inspect URL: https://vercel.com/vaidik2412s-projects/email-template-standalone/32ZLreTRSooz6ycPkbjpwTvwtRxM

## Notes

- Real AiSensy template creation was not exercised locally because that would submit a live template; use the env gate plus real key/URLs when ready.
- `.claude/` remains untracked and was not touched.
