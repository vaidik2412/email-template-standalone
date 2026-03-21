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
          ],
          total: 1,
          limit: 10,
          skip: 0,
        }),
      }),
    );

    render(<TemplatesDashboard />);

    expect(screen.getByRole('heading', { name: /email templates/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create new template/i })).toHaveAttribute(
      'href',
      '/templates/new',
    );

    await waitFor(() => {
      expect(screen.getByText('Lead Follow-up Email')).toBeInTheDocument();
    });

    expect(screen.getByText('Sales CRM')).toBeInTheDocument();
    expect(screen.getByText('Following up on your requirement')).toBeInTheDocument();
  });
});
