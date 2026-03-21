import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    expect(screen.getByLabelText(/email signature/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^add variable$/i })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /publish template/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save as draft/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more template actions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see how to add custom variables/i })).toBeInTheDocument();
    expect(previewPanel).not.toBeNull();
    expect(within(previewPanel as HTMLElement).getByText(/email preview/i)).toBeInTheDocument();
    expect(within(previewPanel as HTMLElement).getByText(/from/i)).toBeInTheDocument();
    expect(
      within(previewPanel as HTMLElement).getByText(/standalone admin <standalone@refrens.local>/i),
    ).toBeInTheDocument();
    expect(within(previewPanel as HTMLElement).getByText(/^to$/i)).toBeInTheDocument();
    expect(
      within(previewPanel as HTMLElement).getByText(/rahul mehta <rahul@mehtatraders.in>/i),
    ).toBeInTheDocument();
    expect(within(previewPanel as HTMLElement).getByText(/^subject$/i)).toBeInTheDocument();
    expect(within(previewPanel as HTMLElement).getByText(/no subject yet/i)).toBeInTheDocument();
    expect(
      within(previewPanel as HTMLElement).getByText(/start writing to preview this email/i),
    ).toBeInTheDocument();
    expect(within(previewPanel as HTMLElement).getByText(/refrens demo business/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email signature/i)).toHaveValue('Regards\nRefrens Demo Business');

    fireEvent.change(screen.getByLabelText(/email subject/i), {
      target: { value: 'Hello {{contact.name}}' },
    });

    fireEvent.change(screen.getByLabelText(/email body/i), {
      target: { value: 'Hello {{contact.name}}' },
    });

    expect(within(previewPanel as HTMLElement).getByText(/email preview/i)).toBeInTheDocument();
    expect(
      within(previewPanel as HTMLElement).getAllByText('Hello Rahul Mehta'),
    ).toHaveLength(2);
  });

  it('updates the preview when the signature section is customized', () => {
    render(<TemplateFormScreen mode='create' />);

    fireEvent.change(screen.getByLabelText(/email signature/i), {
      target: { value: 'Warm regards,\nAmit from Refrens' },
    });

    expect(screen.getByText('Warm regards,')).toBeInTheDocument();
    expect(screen.getByText('Amit from Refrens')).toBeInTheDocument();
  });

  it('inserts a subject variable from the inline picker', async () => {
    render(<TemplateFormScreen mode='create' />);

    fireEvent.click(screen.getByLabelText(/email subject/i));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^add variable$/i }));
    });
    const subjectVariableOption = await screen.findByRole('button', { name: /contact name/i });
    await act(async () => {
      fireEvent.click(subjectVariableOption);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email subject/i)).toHaveValue('{{contact.name}}');
    });
  });

  it('inserts a signature variable at the current caret position', async () => {
    render(<TemplateFormScreen mode='create' />);

    const signatureField = screen.getByLabelText(/email signature/i) as HTMLTextAreaElement;

    await act(async () => {
      fireEvent.change(signatureField, {
        target: { value: 'Regards,\n' },
      });

      signatureField.focus();
      signatureField.setSelectionRange(9, 9);
      fireEvent.select(signatureField);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^add variable$/i }));
    });
    const signatureVariableOption = await screen.findByRole('button', { name: /contact name/i });
    await act(async () => {
      fireEvent.click(signatureVariableOption);
    });

    await waitFor(() => {
      expect(signatureField).toHaveValue('Regards,\n{{contact.name}}');
      expect(signatureField.selectionStart).toBe(signatureField.value.length);
      expect(signatureField.selectionEnd).toBe(signatureField.value.length);
    });
  });

  it('inserts a body variable into the active body editor instead of subject', async () => {
    render(<TemplateFormScreen mode='create' />);

    const bodyField = screen.getByLabelText(/email body/i) as HTMLTextAreaElement;

    await act(async () => {
      fireEvent.change(bodyField, {
        target: { value: 'Hello ' },
      });

      bodyField.focus();
      bodyField.setSelectionRange(6, 6);
      fireEvent.select(bodyField);
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^add variable$/i }));
    });
    const bodyVariableOption = await screen.findByRole('button', { name: /contact name/i });
    await act(async () => {
      fireEvent.click(bodyVariableOption);
    });

    await waitFor(() => {
      expect(bodyField).toHaveValue('Hello {{contact.name}}');
      expect(screen.getByLabelText(/email subject/i)).toHaveValue('');
    });
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

    const [, requestOptions] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    const payload = JSON.parse(String(requestOptions.body)) as {
      body: string;
      signature?: string;
    };

    expect(payload.body).toBe('Hello {{contact.name}}\n\n\nRegards\nRefrens Demo Business');
    expect(payload).not.toHaveProperty('signature');

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
