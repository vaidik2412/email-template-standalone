import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTemplate, listTemplates, getTemplateById, updateTemplate } from '@/server/templates/service';
import { TemplatePayloadValidationError } from '@/server/templates/errors';
import { GET as getTemplates, POST as postTemplate } from '../route';
import { GET as getTemplate, PATCH as patchTemplate } from '../[id]/route';

vi.mock('@/server/templates/service', () => ({
  listTemplates: vi.fn(),
  createTemplate: vi.fn(),
  getTemplateById: vi.fn(),
  updateTemplate: vi.fn(),
}));

describe('templates API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists non-removed email templates', async () => {
    vi.mocked(listTemplates).mockResolvedValue({
      data: [{ _id: 'template-1', name: 'Lead Follow-up' }],
      total: 1,
      limit: 10,
      skip: 0,
    });

    const response = await getTemplates(new Request('http://localhost/api/templates'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: [{ _id: 'template-1', name: 'Lead Follow-up' }],
      total: 1,
      limit: 10,
      skip: 0,
    });
    expect(listTemplates).toHaveBeenCalledOnce();
  });

  it('creates a template and forwards publish intent', async () => {
    vi.mocked(createTemplate).mockResolvedValue({
      _id: 'template-2',
      name: 'New template',
    });

    const response = await postTemplate(
      new Request('http://localhost/api/templates?isPublished=true', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New template',
          subject: 'Hello',
          body: 'World',
        }),
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      _id: 'template-2',
      name: 'New template',
    });
    expect(createTemplate).toHaveBeenCalledWith(
      {
        name: 'New template',
        subject: 'Hello',
        body: 'World',
      },
      {
        isPublished: true,
      },
    );
  });

  it('returns a JSON error payload when create fails unexpectedly', async () => {
    vi.mocked(createTemplate).mockRejectedValue(new Error('MONGODB_URI is required'));

    const response = await postTemplate(
      new Request('http://localhost/api/templates?isPublished=true', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New template',
          subject: 'Hello',
          body: 'World',
        }),
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: 'MONGODB_URI is required',
    });
  });

  it('returns a 400 JSON error payload for validation failures on create', async () => {
    vi.mocked(createTemplate).mockRejectedValue(
      new TemplatePayloadValidationError('CTA buttons can only be used in the email body'),
    );

    const response = await postTemplate(
      new Request('http://localhost/api/templates?isPublished=true', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New template',
          subject: 'Hello',
          body: 'World',
        }),
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'CTA buttons can only be used in the email body',
    });
  });

  it('gets one template by id', async () => {
    vi.mocked(getTemplateById).mockResolvedValue({
      _id: 'template-3',
      name: 'Existing template',
    });

    const response = await getTemplate(new Request('http://localhost/api/templates/template-3'), {
      params: Promise.resolve({
        id: 'template-3',
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      _id: 'template-3',
      name: 'Existing template',
    });
    expect(getTemplateById).toHaveBeenCalledWith('template-3');
  });

  it('patches a template and forwards publish intent', async () => {
    vi.mocked(updateTemplate).mockResolvedValue({
      _id: 'template-4',
      name: 'Published template',
      status: 'LIVE',
    });

    const response = await patchTemplate(
      new Request('http://localhost/api/templates/template-4?isPublished=true', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Published template',
          subject: 'Updated',
          body: 'Updated body',
        }),
        headers: {
          'content-type': 'application/json',
        },
      }),
      {
        params: Promise.resolve({
          id: 'template-4',
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      _id: 'template-4',
      name: 'Published template',
      status: 'LIVE',
    });
    expect(updateTemplate).toHaveBeenCalledWith(
      'template-4',
      {
        name: 'Published template',
        subject: 'Updated',
        body: 'Updated body',
      },
      {
        isPublished: true,
      },
    );
  });

  it('returns a JSON error payload when patch fails unexpectedly', async () => {
    vi.mocked(updateTemplate).mockRejectedValue(new Error('MONGODB_URI is required'));

    const response = await patchTemplate(
      new Request('http://localhost/api/templates/template-4?isPublished=true', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Published template',
          subject: 'Updated',
          body: 'Updated body',
        }),
        headers: {
          'content-type': 'application/json',
        },
      }),
      {
        params: Promise.resolve({
          id: 'template-4',
        }),
      },
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: 'MONGODB_URI is required',
    });
  });

  it('returns a 400 JSON error payload for validation failures on patch', async () => {
    vi.mocked(updateTemplate).mockRejectedValue(
      new TemplatePayloadValidationError('Invalid CTA button'),
    );

    const response = await patchTemplate(
      new Request('http://localhost/api/templates/template-4?isPublished=true', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Published template',
          subject: 'Updated',
          body: 'Updated body',
        }),
        headers: {
          'content-type': 'application/json',
        },
      }),
      {
        params: Promise.resolve({
          id: 'template-4',
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'Invalid CTA button',
    });
  });
});
