import { findInvalidTemplateCtaTokens, hasTemplateCtaTokens } from './templateCtas';
import { findUnsupportedTemplateVariables } from './templateVariables';

type TemplateFieldKind = 'subject' | 'body' | 'signature';
const WHATSAPP_TEMPLATE_BODY_MAX_LENGTH = 1024;
const WHATSAPP_ADJACENT_VARIABLES_PATTERN = /\{\{([^}]+)\}\}\s*\{\{([^}]+)\}\}/;

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

  if (channel === 'WHATSAPP' && hasTemplateCtaTokens(value)) {
    return 'Use the Button section below to add a WhatsApp button instead of CTA tokens in the body.';
  }

  if (channel === 'WHATSAPP' && fieldKind === 'body' && value.length > WHATSAPP_TEMPLATE_BODY_MAX_LENGTH) {
    return `WhatsApp message can be at most ${WHATSAPP_TEMPLATE_BODY_MAX_LENGTH} characters.`;
  }

  if (channel === 'WHATSAPP' && fieldKind === 'body') {
    const adjacentMatch = WHATSAPP_ADJACENT_VARIABLES_PATTERN.exec(value);
    if (adjacentMatch) {
      const first = adjacentMatch[1].trim();
      const second = adjacentMatch[2].trim();
      return `Variables cannot be placed next to each other. Add static text between {{${first}}} and {{${second}}}.`;
    }
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
