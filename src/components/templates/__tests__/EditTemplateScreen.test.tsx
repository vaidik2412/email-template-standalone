import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TemplateFormScreen from '../TemplateFormScreen';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}));

describe('TemplateFormScreen in edit mode', () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads an existing template, patches it, and returns to the dashboard', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'template-1',
          name: 'Existing template',
          subject: 'Original subject',
          body: 'Hello {{contact.name}}\n\n\nBest regards,\nStandalone Admin',
          templateType: 'SALES_CRM',
          status: 'LIVE',
          channel: 'EMAIL',
          isModifiedPostPublish: false,
          isDefault: false,
          isArchived: false,
          isRemoved: false,
          createdAt: '2026-03-21T00:00:00.000Z',
          updatedAt: '2026-03-21T00:00:00.000Z',
          business: {
            _id: 'business-1',
            urlKey: 'demo-business',
            name: 'Refrens Demo Business',
          },
          createdBy: {
            _id: 'user-1',
            name: 'Standalone Admin',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'template-1',
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<TemplateFormScreen mode='edit' templateId='template-1' />);

    expect(screen.getByText(/loading template/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing template')).toBeInTheDocument();
    });

    expect(screen.getByText(/standalone admin <standalone@refrens.local>/i)).toBeInTheDocument();
    expect(screen.getByText(/rahul mehta <rahul@mehtatraders.in>/i)).toBeInTheDocument();
    expect(screen.getByText('Original subject')).toBeInTheDocument();
    expect(screen.getByText('Hello Rahul Mehta')).toBeInTheDocument();
    expect(screen.getByLabelText(/email signature/i)).toHaveValue('Best regards,\nStandalone Admin');

    fireEvent.change(screen.getByLabelText(/email subject/i), {
      target: { value: 'Updated subject' },
    });
    fireEvent.click(screen.getByRole('button', { name: /publish template/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/templates/template-1?isPublished=true',
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });

    const [, requestOptions] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    const payload = JSON.parse(String(requestOptions.body)) as {
      body: string;
      signature?: string;
    };

    expect(payload.body).toBe('Hello {{contact.name}}\n\n\nBest regards,\nStandalone Admin');
    expect(payload).not.toHaveProperty('signature');

    expect(push).toHaveBeenCalledWith('/templates');
  });

  it('loads an existing whatsapp template with a read-only channel field', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'template-whatsapp',
          name: 'WhatsApp reminder',
          subject: '',
          body: 'Hello {{contact.name}}',
          templateType: 'SALES_CRM',
          status: 'DRAFT',
          channel: 'WHATSAPP',
          isModifiedPostPublish: false,
          isDefault: false,
          isArchived: false,
          isRemoved: false,
          createdAt: '2026-03-21T00:00:00.000Z',
          updatedAt: '2026-03-21T00:00:00.000Z',
          business: {
            _id: 'business-1',
            urlKey: 'demo-business',
            name: 'Refrens Demo Business',
          },
          createdBy: {
            _id: 'user-1',
            name: 'Standalone Admin',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          _id: 'template-whatsapp',
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<TemplateFormScreen mode='edit' templateId='template-whatsapp' />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('whatsapp_reminder')).toBeInTheDocument();
    });

    const whatsappRadio = screen.getByRole('radio', { name: /whatsapp/i });
    expect(whatsappRadio).toBeChecked();
    expect(whatsappRadio).toBeDisabled();
    expect(screen.queryByLabelText(/email subject/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/email signature/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/whatsapp message/i)).toHaveValue('Hello {{contact.name}}');
    expect(screen.getByText(/whatsapp preview/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/whatsapp message/i), {
      target: { value: 'Updated {{contact.name}}' },
    });
    fireEvent.click(screen.getByRole('button', { name: /publish template/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/templates/template-whatsapp?isPublished=true',
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });

    const [, requestOptions] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    const payload = JSON.parse(String(requestOptions.body)) as Record<string, unknown>;

    expect(payload).toMatchObject({
      channel: 'WHATSAPP',
      name: 'whatsapp_reminder',
      body: 'Updated {{contact.name}}',
    });
    expect(payload).not.toHaveProperty('subject');
  });
});
