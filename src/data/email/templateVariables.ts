import {
  ACCOUNTING_DOCUMENT_SUBTYPES,
  type DocumentTemplateSubtypeKey,
  type TalosDocumentSubtypeKey,
} from './documentSubtypes';
import type { EmailTemplateTypeKey } from './templateTypes';
import type { TemplateVariableCatalog, TemplateVariableOption } from '../../types/templateVariable';

type IndexedCustomFieldDefinition = {
  name?: string;
  label?: string;
  options?: string[];
  dataType?: string;
  isArchived?: boolean;
  isRemoved?: boolean;
};

type IndexedCustomFieldCollection =
  | Map<string, IndexedCustomFieldDefinition>
  | Record<string, IndexedCustomFieldDefinition>;

export type IndexedCustomFieldsByCategory = Partial<
  Record<'LEADS' | TalosDocumentSubtypeKey, IndexedCustomFieldCollection | undefined>
>;

const CRM_PREVIEW_VALUES = {
  'contact.name': 'Rahul Mehta',
  'contact.email': 'rahul@mehtatraders.in',
  'contact.phone': '+91 98765 43210',
  'contact.country': 'India',
  'company.name': 'Mehta Traders',
  'my.name': 'Standalone Admin',
  'my.phone': '+91 98765 00000',
  'my.business': 'Refrens Demo Business',
  'business.name': 'Refrens Demo Business',
} as const;

const DOCUMENT_SHARED_PREVIEW_VALUES = {
  'document.type': 'Document',
  'document.number': 'DOC-2026-001',
  'document.date': '22 Mar 2026',
  'document.due_date': '06 Apr 2026',
  'document.total': '12,500.00',
  'document.currency': 'INR',
  'document.share_link': 'https://share.refrens.local/documents/DOC-2026-001',
  'customer.name': 'Aarav Industries',
  'customer.email': 'accounts@aaravindustries.in',
  'customer.phone': '+91 99887 77665',
  'business.name': 'Refrens Demo Business',
  'business.email': 'billing@refrens.local',
  'business.phone': '+91 98765 00000',
} as const;

const DOCUMENT_SUBTYPE_SAMPLE_OVERRIDES: Partial<
  Record<DocumentTemplateSubtypeKey, Record<string, string>>
> = {
  INVOICE: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.INVOICE.label,
    'document.number': 'INV-2026-001',
    'document.share_link': 'https://share.refrens.local/invoices/INV-2026-001',
    'document.amount_paid': '3,500.00',
    'document.amount_due': '9,000.00',
  },
  PROFORMA_INVOICE: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.PROFORMA_INVOICE.label,
    'document.number': 'PI-2026-001',
    'document.share_link': 'https://share.refrens.local/proforma-invoices/PI-2026-001',
  },
  QUOTATION: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.QUOTATION.label,
    'document.number': 'QT-2026-001',
    'document.share_link': 'https://share.refrens.local/quotations/QT-2026-001',
  },
  SALES_ORDER: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.SALES_ORDER.label,
    'document.number': 'SO-2026-001',
    'document.share_link': 'https://share.refrens.local/sales-orders/SO-2026-001',
  },
  PURCHASE_ORDER: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.PURCHASE_ORDER.label,
    'document.number': 'PO-2026-001',
    'document.share_link': 'https://share.refrens.local/purchase-orders/PO-2026-001',
  },
  CREDIT_NOTE: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.CREDIT_NOTE.label,
    'document.number': 'CN-2026-001',
    'document.share_link': 'https://share.refrens.local/credit-notes/CN-2026-001',
  },
  DEBIT_NOTE: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.DEBIT_NOTE.label,
    'document.number': 'DN-2026-001',
    'document.share_link': 'https://share.refrens.local/debit-notes/DN-2026-001',
  },
  PAYMENT_RECEIPT: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.PAYMENT_RECEIPT.label,
    'document.number': 'PR-2026-001',
    'document.share_link': 'https://share.refrens.local/payment-receipts/PR-2026-001',
  },
  DELIVERY_CHALLAN: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.DELIVERY_CHALLAN.label,
    'document.number': 'DC-2026-001',
    'document.share_link': 'https://share.refrens.local/delivery-challans/DC-2026-001',
  },
  EXPENDITURE: {
    'document.type': ACCOUNTING_DOCUMENT_SUBTYPES.EXPENDITURE.label,
    'document.number': 'EXP-2026-001',
    'document.share_link': 'https://share.refrens.local/expenditures/EXP-2026-001',
    'document.amount_paid': '2,000.00',
    'document.amount_due': '4,500.00',
  },
};

const CRM_STATIC_VARIABLE_OPTIONS: TemplateVariableOption[] = [
  {
    label: 'Contact Name',
    value: 'contact.name',
    group: 'CRM',
    scope: 'SALES_CRM',
    sampleValue: CRM_PREVIEW_VALUES['contact.name'],
  },
  {
    label: 'Contact Email',
    value: 'contact.email',
    group: 'CRM',
    scope: 'SALES_CRM',
    sampleValue: CRM_PREVIEW_VALUES['contact.email'],
  },
  {
    label: 'Contact Phone',
    value: 'contact.phone',
    group: 'CRM',
    scope: 'SALES_CRM',
    sampleValue: CRM_PREVIEW_VALUES['contact.phone'],
  },
  {
    label: 'Contact Country',
    value: 'contact.country',
    group: 'CRM',
    scope: 'SALES_CRM',
    sampleValue: CRM_PREVIEW_VALUES['contact.country'],
  },
  {
    label: 'Company Name',
    value: 'company.name',
    group: 'CRM',
    scope: 'SALES_CRM',
    sampleValue: CRM_PREVIEW_VALUES['company.name'],
  },
  {
    label: 'My name',
    value: 'my.name',
    group: 'CRM',
    scope: 'SALES_CRM',
    sampleValue: CRM_PREVIEW_VALUES['my.name'],
  },
  {
    label: 'My phone',
    value: 'my.phone',
    group: 'CRM',
    scope: 'SALES_CRM',
    sampleValue: CRM_PREVIEW_VALUES['my.phone'],
  },
  {
    label: 'My business',
    value: 'my.business',
    group: 'CRM',
    scope: 'SALES_CRM',
    sampleValue: CRM_PREVIEW_VALUES['my.business'],
  },
  {
    label: 'Business name',
    value: 'business.name',
    group: 'CRM',
    scope: 'SALES_CRM',
    sampleValue: CRM_PREVIEW_VALUES['business.name'],
  },
];

const ACCOUNTING_SHARED_VARIABLE_OPTIONS: Omit<TemplateVariableOption, 'scope'>[] = [
  { label: 'Document Type', value: 'document.type', group: 'Document' },
  { label: 'Document Number', value: 'document.number', group: 'Document' },
  { label: 'Document Date', value: 'document.date', group: 'Document' },
  { label: 'Due Date', value: 'document.due_date', group: 'Document' },
  { label: 'Document Total', value: 'document.total', group: 'Document' },
  { label: 'Document Currency', value: 'document.currency', group: 'Document' },
  {
    label: 'Document Sharelink',
    value: 'document.share_link',
    group: 'Document',
    bodyOnly: true,
    insertBehavior: 'documentShareLinkCta',
  },
  { label: 'Customer Name', value: 'customer.name', group: 'Document' },
  { label: 'Customer Email', value: 'customer.email', group: 'Document' },
  { label: 'Customer Phone', value: 'customer.phone', group: 'Document' },
  { label: 'Business Name', value: 'business.name', group: 'Document' },
  { label: 'Business Email', value: 'business.email', group: 'Document' },
  { label: 'Business Phone', value: 'business.phone', group: 'Document' },
];

const ACCOUNTING_PAYMENT_VARIABLE_OPTIONS: Omit<TemplateVariableOption, 'scope'>[] = [
  { label: 'Amount Paid', value: 'document.amount_paid', group: 'Document' },
  { label: 'Amount Due', value: 'document.amount_due', group: 'Document' },
];

function getIndexedFieldEntries(
  indexedCustomFields: IndexedCustomFieldsByCategory,
  category: 'LEADS' | TalosDocumentSubtypeKey,
) {
  const source = indexedCustomFields[category];

  if (!source) {
    return [];
  }

  if (source instanceof Map) {
    return Array.from(source.entries());
  }

  return Object.entries(source);
}

function getVendorFieldSampleValue(field: IndexedCustomFieldDefinition) {
  const label = field.label?.trim() || field.name?.trim() || 'Field';

  switch (field.dataType) {
    case 'NUMBER':
    case 'CURRENCY':
      return '12345';
    case 'DATE':
      return '22 Mar 2026';
    case 'EMAIL':
      return 'sample@example.com';
    case 'PHONE':
      return '+91 98765 43210';
    case 'URL':
      return 'https://example.com';
    case 'BOOLEAN':
      return 'Yes';
    case 'SELECT':
    case 'RADIO':
      return field.options?.find(Boolean) || `Sample ${label}`;
    case 'MULTISELECT':
    case 'CHECKBOX':
      return field.options?.filter(Boolean).slice(0, 2).join(', ') || `Sample ${label}`;
    case 'TEXTAREA':
    case 'TEXT':
    default:
      return `Sample ${label}`;
  }
}

function getDocumentPreviewValueMap(documentSubtype?: DocumentTemplateSubtypeKey) {
  return {
    ...DOCUMENT_SHARED_PREVIEW_VALUES,
    ...(documentSubtype ? DOCUMENT_SUBTYPE_SAMPLE_OVERRIDES[documentSubtype] : undefined),
  };
}

function getDocumentStaticVariableOptions(documentSubtype?: DocumentTemplateSubtypeKey) {
  const sampleValues = getDocumentPreviewValueMap(documentSubtype);
  const options = ACCOUNTING_SHARED_VARIABLE_OPTIONS.map((option) => ({
    ...option,
    scope: 'ACCOUNTING_DOCUMENTS' as const,
    sampleValue: sampleValues[option.value as keyof typeof sampleValues],
  }));

  if (!documentSubtype || !ACCOUNTING_DOCUMENT_SUBTYPES[documentSubtype].supportsPaymentStatus) {
    return options;
  }

  return options.concat(
    ACCOUNTING_PAYMENT_VARIABLE_OPTIONS.map((option) => ({
      ...option,
      scope: 'ACCOUNTING_DOCUMENTS' as const,
      sampleValue: sampleValues[option.value as keyof typeof sampleValues],
    })),
  );
}

function getVendorFieldOptions(
  templateType: EmailTemplateTypeKey,
  indexedCustomFields: IndexedCustomFieldsByCategory,
  documentSubtype?: DocumentTemplateSubtypeKey,
) {
  const category =
    templateType === 'SALES_CRM'
      ? 'LEADS'
      : documentSubtype
        ? ACCOUNTING_DOCUMENT_SUBTYPES[documentSubtype].talosKey
        : null;

  if (!category) {
    return [] as TemplateVariableOption[];
  }

  return getIndexedFieldEntries(indexedCustomFields, category)
    .filter(([, field]) => field && !field.isArchived && !field.isRemoved)
    .sort(([, leftField], [, rightField]) =>
      (leftField.label || leftField.name || '').localeCompare(rightField.label || rightField.name || ''),
    )
    .map(([fieldKey, field]) => ({
      label: field.label || field.name || fieldKey,
      value: `vendorFields.${fieldKey}`,
      group: 'Vendor Fields',
      scope: templateType,
      dataType: field.dataType,
      sampleValue: getVendorFieldSampleValue(field),
    }));
}

export function buildTemplateVariableCatalog(input: {
  templateType: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
  indexedCustomFields?: IndexedCustomFieldsByCategory;
}): TemplateVariableCatalog {
  const { templateType, documentSubtype, indexedCustomFields = {} } = input;

  const options =
    templateType === 'SALES_CRM'
      ? CRM_STATIC_VARIABLE_OPTIONS
      : getDocumentStaticVariableOptions(documentSubtype);

  return {
    templateType,
    documentSubtype,
    options: options.concat(getVendorFieldOptions(templateType, indexedCustomFields, documentSubtype)),
  };
}

export const CRM_TEMPLATE_VARIABLE_OPTIONS = CRM_STATIC_VARIABLE_OPTIONS;
export const CRM_TEMPLATE_VARIABLE_KEYS = CRM_STATIC_VARIABLE_OPTIONS.map(({ value }) => value);
export const CRM_TEMPLATE_PREVIEW_VALUES = CRM_PREVIEW_VALUES;

export function getDocumentShareLinkCtaLabel(documentSubtype?: DocumentTemplateSubtypeKey) {
  return documentSubtype ? `View ${ACCOUNTING_DOCUMENT_SUBTYPES[documentSubtype].label}` : 'View Document';
}
