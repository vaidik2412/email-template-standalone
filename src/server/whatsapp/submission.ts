import type { DocumentTemplateSubtypeKey } from '@/data/email/documentSubtypes';
import { buildTemplateVariableCatalog } from '@/data/email/templateVariables';
import type { EmailTemplateTypeKey } from '@/data/email/templateTypes';
import { isValidWhatsappLanguage } from '@/data/whatsapp/languages';
import type { TemplateWritePayload } from '@/types/messageTemplate';
import { hasTemplateCtaTokens } from '@/utils/templateCtas';
import { extractTemplateVariableKeys, findUnsupportedTemplateVariables } from '@/utils/templateVariables';
import { isWhatsappTemplateNameSafe } from '@/utils/whatsappTemplateName';
import { buildWhatsappSubmissionPayload } from '@/utils/whatsappTemplateTranslation';

type WhatsappSubmissionTemplateInput = {
  name?: string;
  body?: string;
  templateType?: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
  whatsapp?: TemplateWritePayload['whatsapp'];
};

type WhatsappSubmissionComponent =
  | {
      type: 'HEADER';
      format: 'TEXT';
      text: string;
      variables: string[];
      examples: string[];
    }
  | {
      type: 'BODY';
      text: string;
      variables: string[];
      examples: string[];
    }
  | {
      type: 'FOOTER';
      text: string;
    }
  | {
      type: 'BUTTONS';
      buttons: Array<{
        type: 'URL';
        text: string;
        url: string;
        variables: string[];
        examples: string[];
      }>;
    };

export type WhatsappTemplateSubmissionPayload = {
  name: string;
  category: 'MARKETING' | 'UTILITY';
  language: string;
  templateType: EmailTemplateTypeKey;
  documentSubtype?: DocumentTemplateSubtypeKey;
  components: WhatsappSubmissionComponent[];
};

const WHATSAPP_BODY_MAX_LENGTH = 1024;
const WHATSAPP_TEXT_HEADER_MAX_LENGTH = 60;
const WHATSAPP_FOOTER_MAX_LENGTH = 60;
const WHATSAPP_URL_BUTTON_LABEL_MAX_LENGTH = 20;

export class WhatsappTemplateSubmissionValidationError extends Error {
  errors: string[];

  constructor(errors: string[]) {
    super(errors.join(' '));
    this.name = 'WhatsappTemplateSubmissionValidationError';
    this.errors = errors;
  }
}

function getPreviewValueMap(input: WhatsappSubmissionTemplateInput) {
  const catalog = buildTemplateVariableCatalog({
    templateType: input.templateType || 'SALES_CRM',
    documentSubtype: input.documentSubtype,
  });

  return Object.fromEntries(
    catalog.options.map((option) => [option.value, option.sampleValue || '']),
  );
}

function getAllowedVariableKeys(input: WhatsappSubmissionTemplateInput) {
  const catalog = buildTemplateVariableCatalog({
    templateType: input.templateType || 'SALES_CRM',
    documentSubtype: input.documentSubtype,
  });

  return catalog.options.map((option) => option.value);
}

function validateSupportedVariables(input: {
  value?: string;
  allowedVariableKeys: string[];
  errors: string[];
}) {
  if (!input.value) {
    return;
  }

  const unsupportedVariables = findUnsupportedTemplateVariables(
    input.value,
    input.allowedVariableKeys,
  );

  if (unsupportedVariables.length) {
    input.errors.push(
      `Unsupported variables: ${unsupportedVariables.map((key) => `{{${key}}}`).join(', ')}`,
    );
  }
}

export function validateWhatsappTemplateForSubmission(input: WhatsappSubmissionTemplateInput) {
  const errors: string[] = [];
  const name = input.name?.trim() || '';
  const body = input.body?.trim() || '';
  const category = input.whatsapp?.category;
  const language = input.whatsapp?.language?.trim() || '';
  const header = input.whatsapp?.header?.trim() || '';
  const footer = input.whatsapp?.footer?.trim() || '';
  const button = input.whatsapp?.button;
  const allowedVariableKeys = getAllowedVariableKeys(input);

  if (!name) {
    errors.push('Template name is required.');
  } else if (!isWhatsappTemplateNameSafe(name)) {
    errors.push('Template name must use only lowercase letters, numbers, and underscores.');
  }

  if (category !== 'MARKETING' && category !== 'UTILITY') {
    errors.push('WhatsApp category must be Marketing or Utility.');
  }

  if (!language || !isValidWhatsappLanguage(language)) {
    errors.push('WhatsApp language is required and must be supported.');
  }

  if (!body) {
    errors.push('WhatsApp body is required.');
  } else if (body.length > WHATSAPP_BODY_MAX_LENGTH) {
    errors.push(`WhatsApp body can be at most ${WHATSAPP_BODY_MAX_LENGTH} characters.`);
  }

  if (hasTemplateCtaTokens(body)) {
    errors.push('WhatsApp body cannot contain email CTA tokens.');
  }

  if (header.length > WHATSAPP_TEXT_HEADER_MAX_LENGTH) {
    errors.push(`WhatsApp header can be at most ${WHATSAPP_TEXT_HEADER_MAX_LENGTH} characters.`);
  }

  if (extractTemplateVariableKeys(header).length > 1) {
    errors.push('WhatsApp header can contain at most one variable.');
  }

  if (footer.length > WHATSAPP_FOOTER_MAX_LENGTH) {
    errors.push(`WhatsApp footer can be at most ${WHATSAPP_FOOTER_MAX_LENGTH} characters.`);
  }

  if (extractTemplateVariableKeys(footer).length > 0) {
    errors.push('WhatsApp footer cannot contain variables.');
  }

  if (button?.label || button?.url) {
    const label = button.label?.trim() || '';
    const url = button.url?.trim() || '';

    if (!label || !url) {
      errors.push('WhatsApp URL button requires both label and URL.');
    }

    if (label.length > WHATSAPP_URL_BUTTON_LABEL_MAX_LENGTH) {
      errors.push(
        `WhatsApp URL button label can be at most ${WHATSAPP_URL_BUTTON_LABEL_MAX_LENGTH} characters.`,
      );
    }

    if (extractTemplateVariableKeys(url).length > 1) {
      errors.push('WhatsApp URL button can contain at most one variable.');
    }
  }

  validateSupportedVariables({ value: body, allowedVariableKeys, errors });
  validateSupportedVariables({ value: header, allowedVariableKeys, errors });
  validateSupportedVariables({ value: button?.url, allowedVariableKeys, errors });

  return errors;
}

export function buildWhatsappTemplateSubmissionPayload(
  input: WhatsappSubmissionTemplateInput,
): WhatsappTemplateSubmissionPayload {
  const errors = validateWhatsappTemplateForSubmission(input);

  if (errors.length) {
    throw new WhatsappTemplateSubmissionValidationError(errors);
  }

  const previewValueMap = getPreviewValueMap(input);
  const translation = buildWhatsappSubmissionPayload({
    body: input.body || '',
    header: input.whatsapp?.header,
    footer: input.whatsapp?.footer,
    buttonLabel: input.whatsapp?.button?.label,
    buttonUrl: input.whatsapp?.button?.url,
    previewValueMap,
  });
  const components: WhatsappSubmissionComponent[] = [];

  if (translation.header) {
    const variables = translation.header.variableKey ? [translation.header.variableKey] : [];
    const examples = translation.header.exampleValue ? [translation.header.exampleValue] : [];

    components.push({
      type: 'HEADER',
      format: 'TEXT',
      text: translation.header.translatedText,
      variables,
      examples,
    });
  }

  components.push({
    type: 'BODY',
    text: translation.body.translatedText,
    variables: translation.body.orderedVariables,
    examples: translation.body.exampleValues,
  });

  if (translation.footer) {
    components.push({
      type: 'FOOTER',
      text: translation.footer,
    });
  }

  if (translation.button) {
    components.push({
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: translation.button.label,
          url: translation.button.translatedUrl,
          variables: translation.button.variableKey ? [translation.button.variableKey] : [],
          examples: translation.button.exampleValue ? [translation.button.exampleValue] : [],
        },
      ],
    });
  }

  return {
    name: input.name?.trim() || '',
    category: input.whatsapp?.category as 'MARKETING' | 'UTILITY',
    language: input.whatsapp?.language?.trim() || '',
    templateType: input.templateType || 'SALES_CRM',
    documentSubtype: input.documentSubtype,
    components,
  };
}
