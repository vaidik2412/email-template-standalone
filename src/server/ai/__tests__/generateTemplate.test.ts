import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateTemplate } from '../generateTemplate';

describe('generateTemplate', () => {
  beforeEach(() => {
    vi.stubEnv('APP_OPENAI_API_KEY', 'sk-test');
    vi.stubEnv('APP_OPENAI_MODEL', 'gpt-test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('drops unsupported document share buttons from Sales CRM whatsapp generations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  channel: 'WHATSAPP',
                  templateType: 'SALES_CRM',
                  documentSubtype: null,
                  name: 'catalogue launch offer',
                  subject: '',
                  body: 'Hi {{contact.name}}, we launched a new catalogue.',
                  whatsappCategory: 'MARKETING',
                  whatsappLanguage: 'en',
                  whatsappHeader: 'New Catalogue Launch',
                  whatsappFooter: 'Limited-time introductory offer',
                  whatsappButton: {
                    label: 'View Catalog',
                    url: '{{document.share_link}}',
                  },
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      }),
    );

    const result = await generateTemplate({
      description: 'Create a WhatsApp catalogue launch offer',
    });

    expect(result).toMatchObject({
      channel: 'WHATSAPP',
      templateType: 'SALES_CRM',
      body: 'Hi {{contact.name}}, we launched a new catalogue.',
    });
    expect(result.whatsappButton).toBeUndefined();
  });

  it('keeps document share buttons for accounting whatsapp generations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  channel: 'WHATSAPP',
                  templateType: 'ACCOUNTING_DOCUMENTS',
                  documentSubtype: 'INVOICE',
                  name: 'invoice share',
                  subject: '',
                  body: 'Hi {{customer.name}}, your invoice is ready.',
                  whatsappCategory: 'UTILITY',
                  whatsappLanguage: 'en',
                  whatsappButton: {
                    label: 'View Invoice',
                    url: '{{document.share_link}}',
                  },
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      }),
    );

    const result = await generateTemplate({
      description: 'Create a WhatsApp invoice share message',
    });

    expect(result).toMatchObject({
      channel: 'WHATSAPP',
      templateType: 'ACCOUNTING_DOCUMENTS',
      documentSubtype: 'INVOICE',
      whatsappButton: {
        label: 'View Invoice',
        url: '{{document.share_link}}',
      },
    });
  });
});
