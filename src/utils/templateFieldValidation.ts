import { findInvalidTemplateCtaTokens, hasTemplateCtaTokens } from './templateCtas';
import { findUnsupportedTemplateVariables } from './templateVariables';

type TemplateFieldKind = 'subject' | 'body' | 'signature';
const WHATSAPP_TEMPLATE_BODY_MAX_LENGTH = 1024;

export function getTemplateFieldValidationError(input: {
  channel?: 'EMAIL' | 'WHATSAPP';
  fieldKind: TemplateFieldKind;
  value: string;
  allowedVariableKeys: string[];
}) {
  const { channel = 'EMAIL', fieldKind, value, allowedVariableKeys } = input;

  if (!value.trim()) {
    return null;
  }

  if (channel === 'WHATSAPP' && fieldKind === 'body' && value.length > WHATSAPP_TEMPLATE_BODY_MAX_LENGTH) {
    return `WhatsApp message can be at most ${WHATSAPP_TEMPLATE_BODY_MAX_LENGTH} characters.`;
  }

  if (fieldKind !== 'body' && hasTemplateCtaTokens(value)) {
    return 'CTA buttons can only be used in the email body.';
  }

  const invalidCtaTokens = findInvalidTemplateCtaTokens(value);

  if (fieldKind === 'body' && invalidCtaTokens.length) {
    return 'Invalid CTA button. Use Insert button or the format {{cta label="..." url="..."}}.';
  }

  const invalidVariableKeys = findUnsupportedTemplateVariables(value, allowedVariableKeys);

  if (invalidVariableKeys.length) {
    return `Unsupported variables: ${invalidVariableKeys.map((key) => `{{${key}}}`).join(', ')}`;
  }

  return null;
}
