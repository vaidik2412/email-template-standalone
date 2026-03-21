import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TemplateFormScreen from '../TemplateFormScreen';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}));

describe('TemplateFormScreen in create mode', () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the prod-like header shell and keeps preview as a standalone right-side panel', () => {
    render(<TemplateFormScreen mode='create' />);

    const previewPanel = screen.getByText(/email preview/i).closest('aside');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Business Settings')).toBeInTheDocument();
    expect(screen.getByText('Email Templates')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create new template/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/template name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email body/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish template/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save as draft/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more template actions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see how to add custom variables/i })).toBeInTheDocument();
    expect(previewPanel).not.toBeNull();
    expect(within(previewPanel as HTMLElement).getByText(/email preview/i)).toBeInTheDocument();
    expect(
      within(previewPanel as HTMLElement).getByText(/start writing to preview this email/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email body/i), {
      target: { value: 'Hello {{contact.name}}' },
    });

    expect(within(previewPanel as HTMLElement).getByText(/email preview/i)).toBeInTheDocument();
    expect(within(previewPanel as HTMLElement).getByText('Hello {{contact.name}}')).toBeInTheDocument();
  });

  it('saves a draft without publish semantics', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        _id: 'template-draft',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<TemplateFormScreen mode='create' />);

    fireEvent.change(screen.getByLabelText(/template name/i), {
      target: { value: 'Draft template' },
    });
    fireEvent.change(screen.getByLabelText(/email subject/i), {
      target: { value: 'Draft subject' },
    });
    fireEvent.change(screen.getByLabelText(/email body/i), {
      target: { value: 'Hello {{contact.name}}' },
    });
    fireEvent.click(screen.getByRole('button', { name: /more template actions/i }));
    fireEvent.click(screen.getByRole('button', { name: /save as draft/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/templates',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    expect(push).toHaveBeenCalledWith('/templates/template-draft/edit');
  });

  it('publishes a template with publish semantics', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        _id: 'template-live',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<TemplateFormScreen mode='create' />);

    fireEvent.change(screen.getByLabelText(/template name/i), {
      target: { value: 'Live template' },
    });
    fireEvent.change(screen.getByLabelText(/email subject/i), {
      target: { value: 'Live subject' },
    });
    fireEvent.change(screen.getByLabelText(/email body/i), {
      target: { value: 'Hello {{contact.name}}' },
    });
    fireEvent.click(screen.getByRole('button', { name: /publish template/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/templates?isPublished=true',
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    expect(push).toHaveBeenCalledWith('/templates/template-live/edit');
  });
});
