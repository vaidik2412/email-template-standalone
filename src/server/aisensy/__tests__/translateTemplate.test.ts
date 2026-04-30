import { describe, expect, it } from 'vitest';

import type { SerializedMessageTemplate } from '@/types/messageTemplate';

import { buildAisensyCreatePayload } from '../translateTemplate';

function buildWhatsappTemplate(
  overrides: Partial<SerializedMessageTemplate> = {},
): SerializedMessageTemplate {
  return {
    _id: '681349f882fa6e0ec1abc123',
    name: 'Overdue Payment Reminder',
    subject: '',
    body: 'Hello {{customer.name}}, invoice {{document.number}} total {{document.total}} is due.',
    status: 'DRAFT',
    channel: 'WHATSAPP',
    isModifiedPostPublish: false,
    templateType: 'ACCOUNTING_DOCUMENTS',
    documentSubtype: 'INVOICE',
    business: {
      _id: '681349f882fa6e0ec1abc001',
      urlKey: 'demo',
      name: 'Demo Business',
    },
    isDefault: false,
    isArchived: false,
    isRemoved: false,
    whatsapp: {
      category: 'UTILITY',
      language: 'en',
      button: {
        label: 'View Invoice',
        url: '{{document.share_link}}',
      },
      status: 'PENDING',
    },
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildAisensyCreatePayload', () => {
  it('numbers dynamic CTA URL placeholders from the button scope', () => {
    const payload = buildAisensyCreatePayload(
      buildWhatsappTemplate(),
      {
        'customer.name': 'Aarav Industries',
        'document.number': 'INV-2026-001',
        'document.total': 'INR 12,500.00',
        'document.share_link': 'https://share.refrens.local/invoices/INV-2026-001',
      },
    );

    expect(payload.text).toBe('Hello {{1}}, invoice {{2}} total {{3}} is due.');
    expect(payload.call_to_action).toEqual([
      {
        type: 'URL',
        button_title: 'View Invoice',
        button_value: 'https://share.refrens.local/invoices/{{1}}',
      },
    ]);
  });
});
