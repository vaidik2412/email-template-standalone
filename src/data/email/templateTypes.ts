export const EMAIL_TEMPLATE_TYPES = {
  SALES_CRM: {
    label: 'Sales CRM',
    enabled: true,
    key: 'SALES_CRM',
  },
  ACCOUNTING_DOCUMENTS: {
    label: 'Accounting Documents',
    enabled: false,
    key: 'ACCOUNTING_DOCUMENTS',
  },
  PAYMENT_REMINDERS: {
    label: 'Payment Reminders',
    enabled: false,
    key: 'PAYMENT_REMINDERS',
  },
  TESTIMONIALS: {
    label: 'Testimonials',
    enabled: false,
    key: 'TESTIMONIALS',
  },
} as const;

export type EmailTemplateTypeKey = keyof typeof EMAIL_TEMPLATE_TYPES;

export const ENABLED_EMAIL_TEMPLATE_TYPE_KEYS = Object.keys(EMAIL_TEMPLATE_TYPES).filter(
  (key) => EMAIL_TEMPLATE_TYPES[key as EmailTemplateTypeKey].enabled,
) as EmailTemplateTypeKey[];
