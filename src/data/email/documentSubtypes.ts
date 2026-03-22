export const ACCOUNTING_DOCUMENT_SUBTYPES = {
  INVOICE: {
    key: 'INVOICE',
    label: 'Invoice',
    talosKey: 'INVOICE',
    supportsPaymentStatus: true,
  },
  PROFORMA_INVOICE: {
    key: 'PROFORMA_INVOICE',
    label: 'Proforma Invoice',
    talosKey: 'PROFORMAINV',
    supportsPaymentStatus: false,
  },
  QUOTATION: {
    key: 'QUOTATION',
    label: 'Quotation',
    talosKey: 'QUOTATION',
    supportsPaymentStatus: false,
  },
  SALES_ORDER: {
    key: 'SALES_ORDER',
    label: 'Sales Order',
    talosKey: 'SALESORDER',
    supportsPaymentStatus: false,
  },
  PURCHASE_ORDER: {
    key: 'PURCHASE_ORDER',
    label: 'Purchase Order',
    talosKey: 'PURCHASEORDER',
    supportsPaymentStatus: false,
  },
  CREDIT_NOTE: {
    key: 'CREDIT_NOTE',
    label: 'Credit Note',
    talosKey: 'CREDITNOTE',
    supportsPaymentStatus: false,
  },
  DEBIT_NOTE: {
    key: 'DEBIT_NOTE',
    label: 'Debit Note',
    talosKey: 'DEBITNOTE',
    supportsPaymentStatus: false,
  },
  PAYMENT_RECEIPT: {
    key: 'PAYMENT_RECEIPT',
    label: 'Payment Receipt',
    talosKey: 'PAYMENTRECEIPT',
    supportsPaymentStatus: false,
  },
  DELIVERY_CHALLAN: {
    key: 'DELIVERY_CHALLAN',
    label: 'Delivery Challan',
    talosKey: 'DELIVERYCHALLAN',
    supportsPaymentStatus: false,
  },
  EXPENDITURE: {
    key: 'EXPENDITURE',
    label: 'Expenditure',
    talosKey: 'EXPENDITURE',
    supportsPaymentStatus: true,
  },
} as const;

export type DocumentTemplateSubtypeKey = keyof typeof ACCOUNTING_DOCUMENT_SUBTYPES;

export const ACCOUNTING_DOCUMENT_SUBTYPE_KEYS = Object.keys(
  ACCOUNTING_DOCUMENT_SUBTYPES,
) as DocumentTemplateSubtypeKey[];

export type TalosDocumentSubtypeKey =
  (typeof ACCOUNTING_DOCUMENT_SUBTYPES)[DocumentTemplateSubtypeKey]['talosKey'];

