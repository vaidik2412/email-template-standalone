export type InvoiceEmailDrawerSampleInvoice = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  total: string;
  status: string;
};

export type InvoiceEmailDrawerTemplateOption = {
  id: string;
  name: string;
  subject: string;
  body: string;
  documentSubtype: string;
  source: 'saved' | 'fallback';
};

export type InvoiceEmailDrawerInvoiceDetails = {
  id: string;
  billType: string;
  number: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  total: string;
  amountPaid: string;
  amountDue: string;
  shareLink: string;
  status: string;
};

export type InvoiceEmailDrawerResolvedDraft = {
  invoiceId: string;
  templateId: string;
  templateName: string;
  templateSource: 'saved' | 'fallback';
  documentSubtype: string;
  to: string;
  subject: string;
  body: string;
};
