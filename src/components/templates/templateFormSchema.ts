import { object, string, bool } from 'yup';

import { ENABLED_EMAIL_TEMPLATE_TYPE_KEYS } from '@/data/email/templateTypes';

export const templateFormSchema = object({
  name: string().required('Template name is required').trim().default(''),
  subject: string().required('Subject is required').trim().default(''),
  templateType: string()
    .oneOf(ENABLED_EMAIL_TEMPLATE_TYPE_KEYS)
    .required('Category is required'),
  body: string().required('Body is required').trim().default(''),
  signature: string().default(''),
  isArchived: bool().default(false),
});
