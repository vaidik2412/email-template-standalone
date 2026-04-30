import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AiSensyTemplateApiError,
  getWhatsappTemplateStatus,
  submitWhatsappTemplate,
} from '../templateClient';

const createConfig = {
  enabled: true,
  apiKey: 'aisensy-secret-key',
  createUrl: 'https://aisensy.test/templates',
  statusUrl: 'https://aisensy.test/templates/status',
};

describe('AiSensy template client', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits a whatsapp template with auth headers and canonical payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        templateId: 'tpl_123',
        templateName: 'invoice_reminder',
        status: 'PENDING',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await submitWhatsappTemplate(
      {
        name: 'invoice_reminder',
        category: 'UTILITY',
        language: 'en',
        components: [
          {
            type: 'BODY',
            text: 'Hello {{1}}',
            variables: ['contact.name'],
            examples: ['Rahul Mehta'],
          },
        ],
      },
      createConfig,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://aisensy.test/templates',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer aisensy-secret-key',
          'content-type': 'application/json',
        }),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: 'invoice_reminder',
      category: 'UTILITY',
      language: 'en',
      components: [
        {
          type: 'BODY',
          text: 'Hello {{1}}',
          variables: ['contact.name'],
          examples: ['Rahul Mehta'],
        },
      ],
    });
    expect(result).toEqual({
      id: 'tpl_123',
      name: 'invoice_reminder',
      status: 'PENDING',
      raw: {
        templateId: 'tpl_123',
        templateName: 'invoice_reminder',
        status: 'PENDING',
      },
    });
  });

  it('gets whatsapp template status by id and name', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'tpl_123',
        name: 'invoice_reminder',
        status: 'APPROVED',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await getWhatsappTemplateStatus(
      {
        templateId: 'tpl_123',
        templateName: 'invoice_reminder',
      },
      createConfig,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://aisensy.test/templates/status?templateId=tpl_123&templateName=invoice_reminder',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          authorization: 'Bearer aisensy-secret-key',
        }),
      }),
    );
    expect(result).toEqual({
      id: 'tpl_123',
      name: 'invoice_reminder',
      status: 'APPROVED',
      raw: {
        id: 'tpl_123',
        name: 'invoice_reminder',
        status: 'APPROVED',
      },
    });
  });

  it('gets whatsapp template status with a path template id placeholder', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'tpl_123',
        name: 'invoice_reminder',
        status: 'APPROVED',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await getWhatsappTemplateStatus(
      {
        templateId: 'tpl_123',
        templateName: 'invoice_reminder',
      },
      {
        ...createConfig,
        statusUrl: 'https://aisensy.test/templates/{wa_template_id}',
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://aisensy.test/templates/tpl_123?templateName=invoice_reminder',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('throws a clear status error when the placeholder id is missing', async () => {
    await expect(
      getWhatsappTemplateStatus(
        {
          templateName: 'invoice_reminder',
        },
        {
          ...createConfig,
          statusUrl: 'https://aisensy.test/templates/{wa_template_id}',
        },
      ),
    ).rejects.toMatchObject({
      name: 'AiSensyTemplateApiError',
      status: 400,
      message:
        'AiSensy template status URL requires wa_template_id, but this template has no AiSensy template id.',
    });
  });

  it('normalizes failed responses without leaking the api key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Rejected aisensy-secret-key payload',
        }),
      }),
    );

    await expect(
      submitWhatsappTemplate(
        {
          name: 'bad_template',
          category: 'MARKETING',
          language: 'en',
          components: [],
        },
        createConfig,
      ),
    ).rejects.toMatchObject({
      name: 'AiSensyTemplateApiError',
      status: 400,
      message: 'AiSensy template API error (400): Rejected [redacted] payload',
    });
  });

  it('throws a clear not-configured error when disabled', async () => {
    await expect(
      submitWhatsappTemplate(
        {
          name: 'invoice_reminder',
          category: 'UTILITY',
          language: 'en',
          components: [],
        },
        {
          ...createConfig,
          enabled: false,
        },
      ),
    ).rejects.toBeInstanceOf(AiSensyTemplateApiError);
  });
});
