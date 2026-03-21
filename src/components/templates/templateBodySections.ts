import { EMAIL_TEMPLATE_PREVIEW_CONTEXT } from './templatePreviewUtils';

const TEMPLATE_SIGNATURE_SEPARATOR = '\n\n\n';

export const DEFAULT_EMAIL_SIGNATURE = `Regards\n${EMAIL_TEMPLATE_PREVIEW_CONTEXT.business.name}`;

type TemplateBodySections = {
  body: string;
  signature: string;
};

export function splitTemplateBodySections(value: string): TemplateBodySections {
  const separatorIndex = value.lastIndexOf(TEMPLATE_SIGNATURE_SEPARATOR);

  if (separatorIndex === -1) {
    return {
      body: value,
      signature: DEFAULT_EMAIL_SIGNATURE,
    };
  }

  const body = value.slice(0, separatorIndex).trimEnd();
  const signature = value.slice(separatorIndex + TEMPLATE_SIGNATURE_SEPARATOR.length).trim();

  return {
    body,
    signature: signature || DEFAULT_EMAIL_SIGNATURE,
  };
}

export function composeTemplateBodyWithSignature(body: string, signature: string) {
  const normalizedBody = body.trimEnd();
  const normalizedSignature = signature.trim();

  if (!normalizedSignature) {
    return normalizedBody;
  }

  if (!normalizedBody) {
    return normalizedSignature;
  }

  return `${normalizedBody}${TEMPLATE_SIGNATURE_SEPARATOR}${normalizedSignature}`;
}
