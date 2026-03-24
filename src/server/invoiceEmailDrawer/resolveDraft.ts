import { ACCOUNTING_DOCUMENT_SUBTYPES } from '@/data/email/documentSubtypes';
import { resolveTemplatePreviewText } from '@/components/templates/templatePreviewUtils';

import type {
  InvoiceEmailDrawerResolvedDraft,
  InvoiceEmailDrawerTemplateOption,
} from './types';
import { getSampleInvoiceById } from './invoices';
import { listTemplates } from '../templates/service';

type ResolveInvoiceEmailDrawerDraftInput = {
  invoiceId: string;
  templateId: string;
};

const FALLBACK_INVOICE_EMAIL_TEMPLATES: InvoiceEmailDrawerTemplateOption[] = [
  {
    id: 'fallback-invoice-share',
    name: 'Share Invoice',
    source: 'fallback',
    documentSubtype: 'INVOICE',
    subject: 'Invoice {{document.number}} from {{business.name}}',
    body:
      'Hi {{customer.name}},\n\nPlease find {{document.type}} {{document.number}} dated {{document.date}} for {{document.total}} {{document.currency}}.\n\nView it here: {{document.share_link}}\n\nRegards,\n{{business.name}}',
  },
  {
    id: 'fallback-invoice-due-date',
    name: 'Invoice With Due Date',
    source: 'fallback',
    documentSubtype: 'INVOICE',
    subject: '{{document.type}} {{document.number}} due on {{document.due_date}}',
    body:
      'Hi {{customer.name}},\n\nSharing {{document.type}} {{document.number}} for {{document.total}} {{document.currency}}. The due date is {{document.due_date}}.\n\nYou can review it here: {{document.share_link}}\n\nThanks,\n{{business.name}}',
  },
  {
    id: 'fallback-invoice-payment-status',
    name: 'Invoice Payment Snapshot',
    source: 'fallback',
    documentSubtype: 'INVOICE',
    subject: 'Payment update for {{document.number}}',
    body:
      'Hi {{customer.name}},\n\nHere is the current status for {{document.type}} {{document.number}}.\nAmount paid: {{document.amount_paid}}\nAmount due: {{document.amount_due}}\n\nOpen invoice: {{document.share_link}}\n\nRegards,\n{{business.name}}',
  },
];

const BILL_TYPE_TO_DOCUMENT_SUBTYPE = {
  INVOICE: 'INVOICE',
  PROFORMA_INVOICE: 'PROFORMA_INVOICE',
  PROFORMAINV: 'PROFORMA_INVOICE',
  QUOTATION: 'QUOTATION',
  SALES_ORDER: 'SALES_ORDER',
  SALESORDER: 'SALES_ORDER',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  PURCHASEORDER: 'PURCHASE_ORDER',
  CREDIT_NOTE: 'CREDIT_NOTE',
  CREDITNOTE: 'CREDIT_NOTE',
  DEBIT_NOTE: 'DEBIT_NOTE',
  DEBITNOTE: 'DEBIT_NOTE',
  PAYMENT_RECEIPT: 'PAYMENT_RECEIPT',
  PAYMENTRECEIPT: 'PAYMENT_RECEIPT',
  DELIVERY_CHALLAN: 'DELIVERY_CHALLAN',
  DELIVERYCHALLAN: 'DELIVERY_CHALLAN',
  EXPENDITURE: 'EXPENDITURE',
} as const;

const DOCUMENT_SUBTYPE_PATH_SEGMENTS = {
  INVOICE: 'invoices',
  PROFORMA_INVOICE: 'proforma-invoices',
  QUOTATION: 'quotations',
  SALES_ORDER: 'sales-orders',
  PURCHASE_ORDER: 'purchase-orders',
  CREDIT_NOTE: 'credit-notes',
  DEBIT_NOTE: 'debit-notes',
  PAYMENT_RECEIPT: 'payment-receipts',
  DELIVERY_CHALLAN: 'delivery-challans',
  EXPENDITURE: 'expenditures',
} as const;

export class InvoiceEmailDrawerNotFoundError extends Error {
  status = 404;

  constructor(resource: 'invoice' | 'template', id: string) {
    super(`Unable to find ${resource}: ${id}`);
    this.name = 'InvoiceEmailDrawerNotFoundError';
  }
}

function normalizeSavedTemplate(template: {
  _id: string;
  name: string;
  subject: string;
  body: string;
  channel: string;
  templateType: string;
  documentSubtype?: string;
}) {
  return {
    id: template._id,
    name: template.name,
    subject: template.subject,
    body: template.body,
    documentSubtype: template.documentSubtype || 'INVOICE',
    source: 'saved' as const,
  };
}

function getInvoiceDocumentSubtype(billType: string) {
  return BILL_TYPE_TO_DOCUMENT_SUBTYPE[billType as keyof typeof BILL_TYPE_TO_DOCUMENT_SUBTYPE] || 'INVOICE';
}

function buildFallbackShareLink(documentSubtype: string, documentNumber: string) {
  const segment =
    DOCUMENT_SUBTYPE_PATH_SEGMENTS[
      documentSubtype as keyof typeof DOCUMENT_SUBTYPE_PATH_SEGMENTS
    ] || 'documents';

  return `https://share.refrens.local/${segment}/${encodeURIComponent(documentNumber)}`;
}

function buildInvoiceTemplatePreviewValues(invoice: Awaited<ReturnType<typeof getSampleInvoiceById>>) {
  if (!invoice) {
    return {};
  }

  const documentSubtype = getInvoiceDocumentSubtype(invoice.billType);
  const shareLink = invoice.shareLink || buildFallbackShareLink(documentSubtype, invoice.number);

  return {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES[
      documentSubtype as keyof typeof ACCOUNTING_DOCUMENT_SUBTYPES
    ]?.label || 'Invoice',
    'document.number': invoice.number,
    'document.date': invoice.issueDate,
    'document.due_date': invoice.dueDate,
    'document.total': invoice.total,
    'document.currency': invoice.currency,
    'document.amount_paid': invoice.amountPaid,
    'document.amount_due': invoice.amountDue,
    'document.share_link': shareLink,
    'customer.name': invoice.customerName,
    'customer.email': invoice.customerEmail,
    'customer.phone': invoice.customerPhone,
    'business.name': invoice.businessName,
    'business.email': invoice.businessEmail,
    'business.phone': invoice.businessPhone,
  };
}

export async function listInvoiceEmailTemplates(): Promise<InvoiceEmailDrawerTemplateOption[]> {
  const response = await listTemplates();
  const savedTemplates = response.data
    .filter(
      (template) =>
        template.channel === 'EMAIL' &&
        template.templateType === 'ACCOUNTING_DOCUMENTS' &&
        template.documentSubtype === 'INVOICE',
    )
    .map(normalizeSavedTemplate);

  return savedTemplates.length > 0 ? savedTemplates : FALLBACK_INVOICE_EMAIL_TEMPLATES;
}

export async function resolveInvoiceEmailDrawerDraft(
  input: ResolveInvoiceEmailDrawerDraftInput,
): Promise<InvoiceEmailDrawerResolvedDraft> {
  const [invoice, templates] = await Promise.all([
    getSampleInvoiceById(input.invoiceId),
    listInvoiceEmailTemplates(),
  ]);

  if (!invoice) {
    throw new InvoiceEmailDrawerNotFoundError('invoice', input.invoiceId);
  }

  const selectedTemplate = templates.find((template) => template.id === input.templateId);

  if (!selectedTemplate) {
    throw new InvoiceEmailDrawerNotFoundError('template', input.templateId);
  }

  const previewValues = buildInvoiceTemplatePreviewValues(invoice);

  return {
    invoiceId: invoice.id,
    templateId: selectedTemplate.id,
    templateName: selectedTemplate.name,
    templateSource: selectedTemplate.source,
    documentSubtype: selectedTemplate.documentSubtype,
    to: invoice.customerEmail,
    subject: resolveTemplatePreviewText(selectedTemplate.subject, previewValues),
    body: resolveTemplatePreviewText(selectedTemplate.body, previewValues),
  };
}
