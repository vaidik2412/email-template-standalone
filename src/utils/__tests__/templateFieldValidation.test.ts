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

  it('rejects whatsapp bodies with two variables separated only by whitespace', () => {
    expect(
      getTemplateFieldValidationError({
        channel: 'WHATSAPP',
        fieldKind: 'body',
        value: 'Total: {{document.currency}} {{document.total}} due.',
        allowedVariableKeys: ['document.currency', 'document.total'],
      }),
    ).toMatch(/next to each other/i);
  });

  it('rejects whatsapp bodies with two variables and no static text between them', () => {
    expect(
      getTemplateFieldValidationError({
        channel: 'WHATSAPP',
        fieldKind: 'body',
        value: 'Total: {{document.currency}}{{document.total}} due.',
        allowedVariableKeys: ['document.currency', 'document.total'],
      }),
    ).toMatch(/next to each other/i);
  });

  it('allows whatsapp bodies where variables are separated by static text', () => {
    expect(
      getTemplateFieldValidationError({
        channel: 'WHATSAPP',
        fieldKind: 'body',
        value: 'Total of {{document.total}} in {{document.currency}}.',
        allowedVariableKeys: ['document.currency', 'document.total'],
      }),
    ).toBeNull();
  });

  it('rejects CTA tokens in whatsapp body with helpful message', () => {
    expect(
      getTemplateFieldValidationError({
        channel: 'WHATSAPP',
        fieldKind: 'body',
        value: '{{cta label="Pay now" url="https://pay.test"}}',
        allowedVariableKeys: [],
      }),
    ).toMatch(/Button section/i);
  });
});
