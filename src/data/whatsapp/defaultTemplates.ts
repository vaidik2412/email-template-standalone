import type { EmailTemplateTypeKey } from '../email/templateTypes';
import type { DocumentTemplateSubtypeKey } from '../email/documentSubtypes';

export type DefaultWhatsappTemplate = {
  name: string;
  isDefault: true;
  templateType: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
  isArchived: false;
  body: string;
  whatsapp: {
    category: 'MARKETING' | 'UTILITY';
    language: string;
    header?: string;
    footer?: string;
    button?: {
      label: string;
      url: string;
    };
  };
};

export const DEFAULT_WHATSAPP_TEMPLATES: DefaultWhatsappTemplate[] = [
  // -- Prod-style system template (mirrors existing prod schema) --
  {
    name: 'refrens_invoiceshare',
    isDefault: true,
    templateType: 'ACCOUNTING_DOCUMENTS',
    documentSubtype: 'INVOICE',
    isArchived: false,
    body: 'Hi {{customer.name}},\n\nYour Invoice {{document.number}} from {{business.name}} is ready.\n\n- Invoice Number: {{document.number}}\n- Invoice Date: {{document.date}}\n- Due Date: {{document.due_date}}\n- Total Amount: {{document.currency}} {{document.total}}\n\nPlease review and let us know if you have any questions.',
    whatsapp: {
      category: 'UTILITY',
      language: 'en',
      header: 'Invoice {{document.number}}',
      footer: 'Sent via Refrens',
      button: {
        label: 'View Invoice',
        url: '{{document.share_link}}',
      },
    },
  },
  // -- Quotation share --
  {
    name: 'refrens_quotationshare',
    isDefault: true,
    templateType: 'ACCOUNTING_DOCUMENTS',
    documentSubtype: 'QUOTATION',
    isArchived: false,
    body: 'Hi {{customer.name}},\n\nWe have prepared a Quotation for you.\n\n- Quotation Number: {{document.number}}\n- Date: {{document.date}}\n- Total Amount: {{document.currency}} {{document.total}}\n\nPlease review the details and let us know how you would like to proceed.',
    whatsapp: {
      category: 'UTILITY',
      language: 'en',
      header: 'Quotation {{document.number}}',
      button: {
        label: 'View Quotation',
        url: '{{document.share_link}}',
      },
    },
  },
  // -- Payment receipt --
  {
    name: 'refrens_paymentreceipt',
    isDefault: true,
    templateType: 'ACCOUNTING_DOCUMENTS',
    documentSubtype: 'PAYMENT_RECEIPT',
    isArchived: false,
    body: 'Hi {{customer.name}},\n\nThank you for your payment. Here is your Payment Receipt.\n\n- Receipt Number: {{document.number}}\n- Date: {{document.date}}\n- Amount Paid: {{document.currency}} {{document.amount_paid}}\n\nThank you for your business!',
    whatsapp: {
      category: 'UTILITY',
      language: 'en',
      header: 'Payment Receipt',
      footer: 'Sent via Refrens',
      button: {
        label: 'View Receipt',
        url: '{{document.share_link}}',
      },
    },
  },
  // -- Sales CRM: Follow-up --
  {
    name: 'whatsapp_lead_followup',
    isDefault: true,
    templateType: 'SALES_CRM',
    isArchived: false,
    body: 'Hi {{contact.name}},\n\nThis is {{my.name}} from {{my.business}}. I wanted to follow up on our recent conversation.\n\nWould you have some time this week to discuss further? Looking forward to hearing from you.',
    whatsapp: {
      category: 'MARKETING',
      language: 'en',
    },
  },
  // -- Sales CRM: Introduction --
  {
    name: 'whatsapp_intro_message',
    isDefault: true,
    templateType: 'SALES_CRM',
    isArchived: false,
    body: 'Hi {{contact.name}},\n\nI am {{my.name}} from {{my.business}}. We help businesses like {{company.name}} with their needs.\n\nWould love to connect and understand if we can help. When would be a good time to talk?',
    whatsapp: {
      category: 'MARKETING',
      language: 'en',
    },
  },
];
