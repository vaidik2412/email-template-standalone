import { extractTemplateVariableKeys } from './templateVariables';

export type WhatsappTemplateTranslation = {
  translatedBody: string;
  orderedVariables: string[];
  exampleValues: string[];
};

export function translateWhatsappTemplateBody(
  value: string,
  previewValueMap: Record<string, string> = {},
): WhatsappTemplateTranslation {
  const orderedVariables = extractTemplateVariableKeys(value);
  const translatedBody = orderedVariables.reduce((acc, variableKey, index) => {
    return acc.replaceAll(`{{${variableKey}}}`, `{{${index + 1}}}`);
  }, value);

  return {
    translatedBody,
    orderedVariables,
    exampleValues: orderedVariables.map((key) => previewValueMap[key] || ''),
  };
}
