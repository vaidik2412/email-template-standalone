import { Types } from 'mongoose';

import type { DocumentTemplateSubtypeKey } from '@/data/email/documentSubtypes';
import type { IndexedCustomFieldsByCategory } from '@/data/email/templateVariables';
import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import { connectToDatabase } from '@/server/db';
import { getBusinessConfigurationModel } from '@/server/models/businessConfiguration';
import { getTemplateFieldValidationError } from '@/utils/templateFieldValidation';

import { FIXED_APP_CONTEXT } from '../constants/fixedContext';
import { TemplatePayloadValidationError } from '../templates/errors';
import { splitTemplateBodySections } from '@/components/templates/templateBodySections';
import { buildTemplateVariableCatalog } from './catalog';

export async function getIndexedCustomFieldsSnapshot(): Promise<IndexedCustomFieldsByCategory> {
  await connectToDatabase();

  const BusinessConfiguration = getBusinessConfigurationModel();
  const configuration = await BusinessConfiguration.findOne({
    business: new Types.ObjectId(FIXED_APP_CONTEXT.business.id),
  }).lean();

  return (configuration?.indexedCustomFields || {}) as IndexedCustomFieldsByCategory;
}

export async function getTemplateVariableCatalog(input: {
  templateType: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
}) {
  const indexedCustomFields = await getIndexedCustomFieldsSnapshot();

  return buildTemplateVariableCatalog({
    ...input,
    indexedCustomFields,
  });
}

export async function validateTemplateVariableUsage(input: {
  channel?: 'EMAIL' | 'WHATSAPP';
  templateType: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
  subject?: string;
  body?: string;
}) {
  const { channel = 'EMAIL', templateType, documentSubtype, subject = '', body = '' } = input;

  if (templateType === 'ACCOUNTING_DOCUMENTS' && !documentSubtype) {
    throw new TemplatePayloadValidationError('Document subtype is required for accounting templates');
  }

  const catalog = await getTemplateVariableCatalog({
    templateType,
    documentSubtype,
  });
  const allowedKeys = catalog.options.map((option) => option.value);
  const bodySections = splitTemplateBodySections(body);
  const subjectError =
    channel === 'EMAIL'
      ? getTemplateFieldValidationError({
          channel,
          fieldKind: 'subject',
          value: subject,
          allowedVariableKeys: allowedKeys,
        })
      : null;

  if (subjectError) {
    throw new TemplatePayloadValidationError(subjectError);
  }

  const bodyError = getTemplateFieldValidationError({
    channel,
    fieldKind: 'body',
    value: channel === 'EMAIL' ? bodySections.body : body,
    allowedVariableKeys: allowedKeys,
  });

  if (bodyError) {
    throw new TemplatePayloadValidationError(bodyError);
  }

  const signatureError =
    channel === 'EMAIL'
      ? getTemplateFieldValidationError({
          channel,
          fieldKind: 'signature',
          value: bodySections.signature,
          allowedVariableKeys: allowedKeys,
        })
      : null;

  if (signatureError) {
    throw new TemplatePayloadValidationError(signatureError);
  }
}
