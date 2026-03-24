import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveInvoiceEmailDrawerDraft } = vi.hoisted(() => ({
  resolveInvoiceEmailDrawerDraft: vi.fn(),
}));

vi.mock('@/server/invoiceEmailDrawer/resolveDraft', async () => {
  const actual = await vi.importActual('@/server/invoiceEmailDrawer/resolveDraft');

  return {
    ...(actual as object),
    resolveInvoiceEmailDrawerDraft,
  };
});

import { POST } from '../route';
import { InvoiceEmailDrawerNotFoundError } from '@/server/invoiceEmailDrawer/resolveDraft';

describe('prototype invoice drawer draft route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a resolved draft payload', async () => {
    resolveInvoiceEmailDrawerDraft.mockResolvedValue({
      invoiceId: 'invoice-1',
      templateId: 'template-1',
      subject: 'Invoice INV-001',
      body: 'Hi there',
    });

    const response = await POST(
      new Request('http://localhost/api/prototypes/invoice-email-drawer/draft', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: 'invoice-1',
          templateId: 'template-1',
        }),
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      invoiceId: 'invoice-1',
      templateId: 'template-1',
      subject: 'Invoice INV-001',
      body: 'Hi there',
    });
  });

  it('returns a 400 when the request body is incomplete', async () => {
    const response = await POST(
      new Request('http://localhost/api/prototypes/invoice-email-drawer/draft', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: 'invoice-1',
        }),
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: 'invoiceId and templateId are required',
    });
  });

  it('returns a 404 when the selected invoice or template cannot be found', async () => {
    resolveInvoiceEmailDrawerDraft.mockRejectedValue(
      new InvoiceEmailDrawerNotFoundError('invoice', 'missing-invoice'),
    );

    const response = await POST(
      new Request('http://localhost/api/prototypes/invoice-email-drawer/draft', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: 'missing-invoice',
          templateId: 'template-1',
        }),
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      message: 'Unable to find invoice: missing-invoice',
    });
  });
});
