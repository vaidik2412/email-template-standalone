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
          body: 'Hello {{contact.name}}',
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

    expect(push).toHaveBeenCalledWith('/templates');
  });
});
