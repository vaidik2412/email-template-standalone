import { object, string, bool } from 'yup';

import { ACCOUNTING_DOCUMENT_SUBTYPE_KEYS } from '@/data/email/documentSubtypes';
import { ENABLED_EMAIL_TEMPLATE_TYPE_KEYS } from '@/data/email/templateTypes';

export const templateFormSchema = object({
  name: string().required('Template name is required').trim().default(''),
  subject: string().required('Subject is required').trim().default(''),
  templateType: string()
    .oneOf(ENABLED_EMAIL_TEMPLATE_TYPE_KEYS)
    .required('Category is required'),
  documentSubtype: string().when('templateType', {
    is: 'ACCOUNTING_DOCUMENTS',
    then: (schema) =>
      schema
        .oneOf(ACCOUNTING_DOCUMENT_SUBTYPE_KEYS)
        .required('Document subtype is required'),
    otherwise: (schema) => schema.default('').notRequired(),
  }),
  body: string().required('Body is required').trim().default(''),
  signature: string().default(''),
  isArchived: bool().default(false),
});
