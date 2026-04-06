import { describe, expect, it } from 'vitest';

import {
  translateWhatsappTemplateBody,
  buildWhatsappSubmissionPayload,
} from '../whatsappTemplateTranslation';

describe('translateWhatsappTemplateBody', () => {
  it('converts named variables into ordered positional placeholders', () => {
    expect(
      translateWhatsappTemplateBody(
        'Hello {{contact.name}}, invoice {{document.number}} is due.',
      ),
    ).toEqual({
      translatedBody: 'Hello {{1}}, invoice {{2}} is due.',
      orderedVariables: ['contact.name', 'document.number'],
      exampleValues: expect.any(Array),
    });
  });

  it('reuses the same placeholder for repeated variables', () => {
    expect(
      translateWhatsappTemplateBody(
        'Hello {{contact.name}}, confirming for {{contact.name}}.',
      ),
    ).toMatchObject({
      translatedBody: 'Hello {{1}}, confirming for {{1}}.',
      orderedVariables: ['contact.name'],
    });
  });
});

describe('buildWhatsappSubmissionPayload', () => {
  it('builds body-only payload when no optional fields are provided', () => {
    const payload = buildWhatsappSubmissionPayload({
      body: 'Hi {{contact.name}}, your invoice {{document.number}} is ready.',
    });

    expect(payload.body.translatedText).toBe('Hi {{1}}, your invoice {{2}} is ready.');
    expect(payload.body.orderedVariables).toEqual(['contact.name', 'document.number']);
    expect(payload.header).toBeUndefined();
    expect(payload.footer).toBeUndefined();
    expect(payload.button).toBeUndefined();
  });

  it('translates header variable independently from body', () => {
    const payload = buildWhatsappSubmissionPayload({
      body: 'Hi {{contact.name}}, details below.',
      header: 'Invoice {{document.number}}',
    });

    expect(payload.body.translatedText).toBe('Hi {{1}}, details below.');
    expect(payload.body.orderedVariables).toEqual(['contact.name']);
    expect(payload.header?.translatedText).toBe('Invoice {{1}}');
    expect(payload.header?.variableKey).toBe('document.number');
  });

  it('includes footer as plain text', () => {
    const payload = buildWhatsappSubmissionPayload({
      body: 'Hello there.',
      footer: 'Sent via Refrens',
    });

    expect(payload.footer).toBe('Sent via Refrens');
  });

  it('translates button URL variable independently', () => {
    const payload = buildWhatsappSubmissionPayload({
      body: 'Hi {{customer.name}}, your invoice is ready.',
      buttonLabel: 'View Invoice',
      buttonUrl: '{{document.share_link}}',
      previewValueMap: {
        'customer.name': 'Aarav Industries',
        'document.share_link': 'https://share.refrens.com/invoices/INV-001',
      },
    });

    expect(payload.button?.label).toBe('View Invoice');
    expect(payload.button?.translatedUrl).toBe('{{1}}');
    expect(payload.button?.variableKey).toBe('document.share_link');
    expect(payload.button?.exampleValue).toBe('https://share.refrens.com/invoices/INV-001');
  });

  it('omits button when label or url is empty', () => {
    const payload = buildWhatsappSubmissionPayload({
      body: 'Hello.',
      buttonLabel: 'View',
      buttonUrl: '',
    });

    expect(payload.button).toBeUndefined();
  });
});
