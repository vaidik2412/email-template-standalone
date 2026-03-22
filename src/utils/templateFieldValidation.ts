import { findInvalidTemplateCtaTokens, hasTemplateCtaTokens } from './templateCtas';
import { findUnsupportedTemplateVariables } from './templateVariables';

type TemplateFieldKind = 'subject' | 'body' | 'signature';

export function getTemplateFieldValidationError(input: {
  fieldKind: TemplateFieldKind;
  value: string;
  allowedVariableKeys: string[];
}) {
  const { fieldKind, value, allowedVariableKeys } = input;

  if (!value.trim()) {
    return null;
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
