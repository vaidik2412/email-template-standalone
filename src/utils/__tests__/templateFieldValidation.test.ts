import { describe, expect, it } from 'vitest';

import { getTemplateFieldValidationError } from '../templateFieldValidation';

describe('getTemplateFieldValidationError', () => {
  it('rejects whatsapp bodies longer than 1024 characters', () => {
    expect(
      getTemplateFieldValidationError({
        channel: 'WHATSAPP',
        fieldKind: 'body',
        value: 'x'.repeat(1025),
        allowedVariableKeys: [],
      }),
    ).toMatch(/1024/i);
  });

  it('allows CTA tokens in whatsapp body content', () => {
    expect(
      getTemplateFieldValidationError({
        channel: 'WHATSAPP',
        fieldKind: 'body',
        value: '{{cta label="Pay now" url="https://pay.test"}}',
        allowedVariableKeys: [],
      }),
    ).toBeNull();
  });
});
