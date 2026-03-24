import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listTemplates } = vi.hoisted(() => ({
  listTemplates: vi.fn(),
}));

const { getSampleInvoiceById } = vi.hoisted(() => ({
  getSampleInvoiceById: vi.fn(),
}));

vi.mock('../../templates/service', () => ({
  listTemplates,
}));

vi.mock('../invoices', () => ({
  getSampleInvoiceById,
}));

import {
  InvoiceEmailDrawerNotFoundError,
  listInvoiceEmailTemplates,
  resolveInvoiceEmailDrawerDraft,
} from '../resolveDraft';

describe('invoice email drawer draft resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists saved accounting invoice templates when they exist', async () => {
    listTemplates.mockResolvedValue({
      data: [
        {
          _id: 'template-1',
          name: 'Invoice Share',
          subject: 'Invoice {{document.number}}',
          body: 'Hi {{customer.name}}',
          channel: 'EMAIL',
          templateType: 'ACCOUNTING_DOCUMENTS',
          documentSubtype: 'INVOICE',
        },
        {
          _id: 'template-2',
          name: 'Lead Follow-up',
          subject: 'Follow up',
          body: 'CRM body',
          channel: 'EMAIL',
          templateType: 'SALES_CRM',
        },
      ],
    });

    await expect(listInvoiceEmailTemplates()).resolves.toEqual([
      {
        id: 'template-1',
        name: 'Invoice Share',
        subject: 'Invoice {{document.number}}',
        body: 'Hi {{customer.name}}',
        documentSubtype: 'INVOICE',
        source: 'saved',
      },
    ]);
  });

  it('falls back to built-in invoice templates when the collection has none', async () => {
    listTemplates.mockResolvedValue({
      data: [
        {
          _id: 'template-2',
          name: 'Lead Follow-up',
          subject: 'Follow up',
          body: 'CRM body',
          channel: 'EMAIL',
          templateType: 'SALES_CRM',
        },
      ],
    });

    const templates = await listInvoiceEmailTemplates();

    expect(templates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'fallback-invoice-share',
          source: 'fallback',
          documentSubtype: 'INVOICE',
        }),
      ]),
    );
  });

  it('resolves a selected template once against the chosen invoice and preserves unknown tokens', async () => {
    listTemplates.mockResolvedValue({
      data: [
        {
          _id: 'template-1',
          name: 'Invoice Share',
          subject: 'Invoice {{document.number}} from {{business.name}}',
          body:
            'Hi {{customer.name}},\nPlease review {{document.type}} {{document.number}} for {{document.total}} {{document.currency}}.\nView here: {{document.share_link}}\n{{unknown.value}}',
          channel: 'EMAIL',
          templateType: 'ACCOUNTING_DOCUMENTS',
          documentSubtype: 'INVOICE',
        },
      ],
    });
    getSampleInvoiceById.mockResolvedValue({
      id: 'invoice-1',
      billType: 'INVOICE',
      number: 'INV-SC6-102',
      customerName: 'Alpha Corp',
      customerEmail: 'finance@alphacorp.in',
      customerPhone: '',
      businessName: 'Tech Solutions Pvt Ltd',
      businessEmail: 'billing@techsolutions.example',
      businessPhone: '',
      issueDate: '14 Mar 2026',
      dueDate: '01 Apr 2026',
      currency: 'INR',
      total: '12,500.00',
      amountPaid: '0.00',
      amountDue: '12,500.00',
      shareLink: 'https://share.refrens.local/invoices/INV-SC6-102',
      status: 'UNPAID',
    });

    await expect(
      resolveInvoiceEmailDrawerDraft({
        invoiceId: 'invoice-1',
        templateId: 'template-1',
      }),
    ).resolves.toEqual({
      invoiceId: 'invoice-1',
      templateId: 'template-1',
      templateName: 'Invoice Share',
      templateSource: 'saved',
      documentSubtype: 'INVOICE',
      to: 'finance@alphacorp.in',
      subject: 'Invoice INV-SC6-102 from Tech Solutions Pvt Ltd',
      body:
        'Hi Alpha Corp,\nPlease review Invoice INV-SC6-102 for 12,500.00 INR.\nView here: https://share.refrens.local/invoices/INV-SC6-102\n{{unknown.value}}',
    });
  });

  it('throws a not found error when the invoice cannot be loaded', async () => {
    listTemplates.mockResolvedValue({
      data: [],
    });
    getSampleInvoiceById.mockResolvedValue(null);

    await expect(
      resolveInvoiceEmailDrawerDraft({
        invoiceId: 'missing-invoice',
        templateId: 'fallback-invoice-share',
      }),
    ).rejects.toBeInstanceOf(InvoiceEmailDrawerNotFoundError);
  });
});
