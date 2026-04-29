import { describe, expect, it } from 'vitest';

import {
  buildWhatsappTemplateSubmissionPayload,
  validateWhatsappTemplateForSubmission,
  WhatsappTemplateSubmissionValidationError,
} from '../submission';

describe('validateWhatsappTemplateForSubmission', () => {
  const validTemplate = {
    name: 'invoice_share_followup',
    body: 'Hi {{customer.name}}, your Invoice {{document.number}} is ready.',
    templateType: 'ACCOUNTING_DOCUMENTS' as const,
    documentSubtype: 'INVOICE' as const,
    whatsapp: {
      category: 'UTILITY' as const,
      language: 'en',
      header: 'Invoice {{document.number}}',
      footer: 'Thanks for your business',
      button: {
        label: 'View Invoice',
        url: '{{document.share_link}}',
      },
    },
  };

  it('accepts the supported WhatsApp subset before submission', () => {
    expect(validateWhatsappTemplateForSubmission(validTemplate)).toEqual([]);
  });

  it('rejects names that WhatsApp providers cannot submit', () => {
    expect(validateWhatsappTemplateForSubmission({ ...validTemplate, name: 'Invoice Share' })).toContain(
      'Template name must use only lowercase letters, numbers, and underscores.',
    );
  });

  it('rejects footer variables and headers with multiple variables', () => {
    const errors = validateWhatsappTemplateForSubmission({
      ...validTemplate,
      whatsapp: {
        ...validTemplate.whatsapp,
        header: '{{document.number}} for {{customer.name}}',
        footer: 'Thanks {{customer.name}}',
      },
    });

    expect(errors).toContain('WhatsApp header can contain at most one variable.');
    expect(errors).toContain('WhatsApp footer cannot contain variables.');
  });

  it('rejects incomplete or over-variable URL buttons', () => {
    const errors = validateWhatsappTemplateForSubmission({
      ...validTemplate,
      whatsapp: {
        ...validTemplate.whatsapp,
        button: {
          label: 'View Invoice',
          url: '{{document.share_link}}/{{customer.name}}',
        },
      },
    });

    expect(errors).toContain('WhatsApp URL button can contain at most one variable.');
  });
});

describe('buildWhatsappTemplateSubmissionPayload', () => {
  it('builds canonical components with positional placeholders and examples', () => {
    expect(
      buildWhatsappTemplateSubmissionPayload({
        name: 'invoice_share_followup',
        body: 'Hi {{customer.name}}, your Invoice {{document.number}} is ready.',
        templateType: 'ACCOUNTING_DOCUMENTS',
        documentSubtype: 'INVOICE',
        whatsapp: {
          category: 'UTILITY',
          language: 'en',
          header: 'Invoice {{document.number}}',
          footer: 'Thanks for your business',
          button: {
            label: 'View Invoice',
            url: '{{document.share_link}}',
          },
        },
      }),
    ).toEqual({
      name: 'invoice_share_followup',
      category: 'UTILITY',
      language: 'en',
      templateType: 'ACCOUNTING_DOCUMENTS',
      documentSubtype: 'INVOICE',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text: 'Invoice {{1}}',
          variables: ['document.number'],
          examples: ['INV-2026-001'],
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, your Invoice {{2}} is ready.',
          variables: ['customer.name', 'document.number'],
          examples: ['Aarav Industries', 'INV-2026-001'],
        },
        {
          type: 'FOOTER',
          text: 'Thanks for your business',
        },
        {
          type: 'BUTTONS',
          buttons: [
            {
              type: 'URL',
              text: 'View Invoice',
              url: '{{1}}',
              variables: ['document.share_link'],
              examples: ['https://share.refrens.local/invoices/INV-2026-001'],
            },
          ],
        },
      ],
    });
  });

  it('throws a validation error instead of building an un-submittable payload', () => {
    expect(() =>
      buildWhatsappTemplateSubmissionPayload({
        name: 'Invoice Share',
        body: 'Hello {{customer.name}}',
        templateType: 'ACCOUNTING_DOCUMENTS',
        documentSubtype: 'INVOICE',
        whatsapp: {
          category: 'UTILITY',
          language: 'en',
        },
      }),
    ).toThrow(WhatsappTemplateSubmissionValidationError);
  });
});
