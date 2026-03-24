import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { InvoiceEmailDrawerPrototypePage } from '../InvoiceEmailDrawerPrototypePage';

function mockFetchImplementation() {
  return vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith('/api/prototypes/invoice-email-drawer/invoices')) {
      return {
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'invoice-1',
              number: 'INV-SC6-102',
              customerName: 'Alpha Corp',
              customerEmail: 'finance@alphacorp.in',
              issueDate: '14 Mar 2026',
              dueDate: '01 Apr 2026',
              currency: 'INR',
              total: '12,500.00',
              status: 'UNPAID',
            },
          ],
        }),
      };
    }

    if (url.endsWith('/api/prototypes/invoice-email-drawer/templates')) {
      return {
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'fallback-invoice-share',
              name: 'Share Invoice',
              subject: 'Invoice {{document.number}} from {{business.name}}',
              body: 'Hi {{customer.name}}',
              source: 'fallback',
              documentSubtype: 'INVOICE',
            },
            {
              id: 'fallback-invoice-due-date',
              name: 'Invoice With Due Date',
              subject: '{{document.type}} {{document.number}} due on {{document.due_date}}',
              body: 'Hi {{customer.name}}, due {{document.due_date}}',
              source: 'fallback',
              documentSubtype: 'INVOICE',
            },
          ],
        }),
      };
    }

    if (url.endsWith('/api/prototypes/invoice-email-drawer/draft') && init?.method === 'POST') {
      const payload = JSON.parse(String(init.body || '{}')) as { templateId?: string };

      if (payload.templateId === 'fallback-invoice-due-date') {
        return {
          ok: true,
          json: async () => ({
            invoiceId: 'invoice-1',
            templateId: 'fallback-invoice-due-date',
            templateName: 'Invoice With Due Date',
            templateSource: 'fallback',
            documentSubtype: 'INVOICE',
            to: 'finance@alphacorp.in',
            subject: 'Invoice INV-SC6-102 due on 01 Apr 2026',
            body: 'Hi Alpha Corp, due 01 Apr 2026',
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          invoiceId: 'invoice-1',
          templateId: 'fallback-invoice-share',
          templateName: 'Share Invoice',
          templateSource: 'fallback',
          documentSubtype: 'INVOICE',
          to: 'finance@alphacorp.in',
          subject: 'Invoice INV-SC6-102 from Tech Solutions Pvt Ltd',
          body: 'Hi Alpha Corp,\nPlease review your invoice.',
        }),
      };
    }

    throw new Error(`Unhandled fetch: ${url}`);
  });
}

describe('InvoiceEmailDrawerPrototypePage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchImplementation());
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens a production-style drawer and resolves the selected template into editable fields', async () => {
    render(<InvoiceEmailDrawerPrototypePage />);

    await waitFor(() => {
      expect(screen.getByText('INV-SC6-102')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /open email drawer for inv-sc6-102/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /email invoice/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email template/i), {
      target: {
        value: 'fallback-invoice-share',
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email subject/i)).toHaveValue(
        'Invoice INV-SC6-102 from Tech Solutions Pvt Ltd',
      );
    });

    expect(screen.getByLabelText(/client email/i)).toHaveValue('finance@alphacorp.in');
    expect(screen.getByLabelText(/client name/i)).toHaveValue('Alpha Corp');
    expect(screen.getByLabelText(/message/i)).toHaveValue('Hi Alpha Corp,\nPlease review your invoice.');
    expect(screen.getByRole('button', { name: /see preview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send email/i })).toBeEnabled();
  });

  it('confirms before replacing edited subject and body when the template changes', async () => {
    const confirmMock = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmMock);

    render(<InvoiceEmailDrawerPrototypePage />);

    await waitFor(() => {
      expect(screen.getByText('INV-SC6-102')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /open email drawer for inv-sc6-102/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/email template/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email template/i), {
      target: {
        value: 'fallback-invoice-share',
      },
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email subject/i)).toHaveValue(
        'Invoice INV-SC6-102 from Tech Solutions Pvt Ltd',
      );
    });

    fireEvent.change(screen.getByLabelText(/email subject/i), {
      target: {
        value: 'Manual subject edit',
      },
    });

    fireEvent.change(screen.getByLabelText(/email template/i), {
      target: {
        value: 'fallback-invoice-due-date',
      },
    });

    expect(confirmMock).toHaveBeenCalledWith(
      'Changing the template will discard your manual edits. Do you want to continue?',
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/email subject/i)).toHaveValue(
        'Invoice INV-SC6-102 due on 01 Apr 2026',
      );
    });
  });

  it('shows a friendly load error when the invoices endpoint returns invalid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON");
        },
      }),
    );

    render(<InvoiceEmailDrawerPrototypePage />);

    await waitFor(() => {
      expect(screen.getByText('Unexpected server response. Please refresh the page.')).toBeInTheDocument();
    });
  });
});
