import { extractTemplateVariableKeys } from './templateVariables';

export type WhatsappTemplateTranslation = {
  translatedBody: string;
  orderedVariables: string[];
  exampleValues: string[];
};

export type WhatsappSubmissionPayload = {
  body: {
    translatedText: string;
    orderedVariables: string[];
    exampleValues: string[];
  };
  header?: {
    translatedText: string;
    variableKey?: string;
    exampleValue?: string;
  };
  footer?: string;
  button?: {
    label: string;
    translatedUrl: string;
    variableKey?: string;
    exampleValue?: string;
  };
};

function translateVariablesToPositional(
  text: string,
  previewValueMap: Record<string, string> = {},
): { translatedText: string; orderedVariables: string[]; exampleValues: string[] } {
  const orderedVariables = extractTemplateVariableKeys(text);
  const translatedText = orderedVariables.reduce((acc, variableKey, index) => {
    return acc.replaceAll(`{{${variableKey}}}`, `{{${index + 1}}}`);
  }, text);

  return {
    translatedText,
    orderedVariables,
    exampleValues: orderedVariables.map((key) => previewValueMap[key] || ''),
  };
}

export function translateWhatsappTemplateBody(
  value: string,
  previewValueMap: Record<string, string> = {},
): WhatsappTemplateTranslation {
  const { translatedText, orderedVariables, exampleValues } = translateVariablesToPositional(
    value,
    previewValueMap,
  );

  return {
    translatedBody: translatedText,
    orderedVariables,
    exampleValues,
  };
}

export function buildWhatsappSubmissionPayload(input: {
  body: string;
  header?: string;
  footer?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  previewValueMap?: Record<string, string>;
}): WhatsappSubmissionPayload {
  const { body, header, footer, buttonLabel, buttonUrl, previewValueMap = {} } = input;

  const bodyTranslation = translateVariablesToPositional(body, previewValueMap);

  const result: WhatsappSubmissionPayload = {
    body: {
      translatedText: bodyTranslation.translatedText,
      orderedVariables: bodyTranslation.orderedVariables,
      exampleValues: bodyTranslation.exampleValues,
    },
  };

  if (header?.trim()) {
    const headerVars = extractTemplateVariableKeys(header);
    const headerVar = headerVars[0];
    const translatedHeader = headerVar
      ? header.replaceAll(`{{${headerVar}}}`, '{{1}}')
      : header;

    result.header = {
      translatedText: translatedHeader,
      variableKey: headerVar,
      exampleValue: headerVar ? previewValueMap[headerVar] || '' : undefined,
    };
  }

  if (footer?.trim()) {
    result.footer = footer.trim();
  }

  if (buttonLabel?.trim() && buttonUrl?.trim()) {
    const urlVars = extractTemplateVariableKeys(buttonUrl);
    const urlVar = urlVars[0];
    const translatedUrl = urlVar
      ? buttonUrl.replaceAll(`{{${urlVar}}}`, '{{1}}')
      : buttonUrl;

    result.button = {
      label: buttonLabel.trim(),
      translatedUrl,
      variableKey: urlVar,
      exampleValue: urlVar ? previewValueMap[urlVar] || '' : undefined,
    };
  }

  return result;
}
