import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import TemplatesDashboard from '../TemplatesDashboard';

describe('TemplatesDashboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders template rows and the create CTA', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              _id: 'template-1',
              name: 'Lead Follow-up Email',
              channel: 'EMAIL',
              templateType: 'SALES_CRM',
              status: 'LIVE',
              isArchived: false,
              isModifiedPostPublish: false,
              subject: 'Following up on your requirement',
              createdBy: {
                _id: 'user-1',
                name: 'Standalone Admin',
              },
              createdAt: '2026-03-21T00:00:00.000Z',
              updatedAt: '2026-03-21T00:00:00.000Z',
            },
            {
              _id: 'template-2',
              name: 'Payment Reminder',
              channel: 'WHATSAPP',
              templateType: 'ACCOUNTING_DOCUMENTS',
              status: 'DRAFT',
              isArchived: false,
              isModifiedPostPublish: true,
              subject: '',
              createdBy: {
                _id: 'user-1',
                name: 'Standalone Admin',
              },
              createdAt: '2026-03-22T00:00:00.000Z',
              updatedAt: '2026-03-22T00:00:00.000Z',
            },
          ],
          total: 2,
          limit: 10,
          skip: 0,
        }),
      }),
    );

    render(<TemplatesDashboard />);

    expect(screen.getByRole('heading', { name: /message templates/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create new template/i })).toHaveAttribute(
      'href',
      '/templates/new',
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Follow-up Email')).toBeInTheDocument();
    });

    expect(screen.getByText('Sales CRM')).toBeInTheDocument();
    expect(screen.getByText('Following up on your requirement')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Payment Reminder')).toBeInTheDocument();
    expect(screen.getByText(/not used for whatsapp/i)).toBeInTheDocument();
  });
});
