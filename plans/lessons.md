# Lessons

## 2026-04-29 - WhatsApp Name Normalization

- Correction: normalizing WhatsApp template names on every keystroke stripped a trailing underscore, so users could not type names like `invoice_share` naturally.
- Rule: separate live input normalization from final submission normalization. Live normalization may clean invalid characters, but must preserve in-progress cursor/end states such as a trailing underscore.
- Prevention: add regression tests for typing behavior, not only final normalized output.
