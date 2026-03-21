import { removeMarkdownEditorsInternalVariables } from '@/utils/removeMarkdownEditorsInternalVariables';

type TemplatePreviewContext = {
  sender: {
    name: string;
    email: string;
    phone: string;
  };
  recipient: {
    name: string;
    email: string;
    phone: string;
    country: string;
    companyName: string;
  };
  business: {
    name: string;
  };
};

type SubjectVariableInsertResult = {
  nextValue: string;
  nextSelectionStart: number;
  nextSelectionEnd: number;
};

export const EMAIL_TEMPLATE_PREVIEW_CONTEXT: TemplatePreviewContext = Object.freeze({
  sender: {
    name: 'Standalone Admin',
    email: 'standalone@refrens.local',
    phone: '+91 98765 00000',
  },
  recipient: {
    name: 'Rahul Mehta',
    email: 'rahul@mehtatraders.in',
    phone: '+91 98765 43210',
    country: 'India',
    companyName: 'Mehta Traders',
  },
  business: {
    name: 'Refrens Demo Business',
  },
});

const PREVIEW_VARIABLE_VALUES: Record<string, string> = {
  'contact.name': EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.name,
  'contact.email': EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.email,
  'contact.phone': EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.phone,
  'contact.country': EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.country,
  'company.name': EMAIL_TEMPLATE_PREVIEW_CONTEXT.recipient.companyName,
  'my.name': EMAIL_TEMPLATE_PREVIEW_CONTEXT.sender.name,
  'my.phone': EMAIL_TEMPLATE_PREVIEW_CONTEXT.sender.phone,
  'my.business': EMAIL_TEMPLATE_PREVIEW_CONTEXT.business.name,
  'business.name': EMAIL_TEMPLATE_PREVIEW_CONTEXT.business.name,
};

const TEMPLATE_VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

export function resolveTemplatePreviewText(value: string) {
  const normalizedValue = removeMarkdownEditorsInternalVariables(value);

  return normalizedValue.replace(TEMPLATE_VARIABLE_PATTERN, (match, token: string) => {
    return PREVIEW_VARIABLE_VALUES[token] ?? match;
  });
}

export function getTemplateVariableToken(variableKey: string) {
  return `{{${variableKey}}}`;
}

export function insertTemplateVariableAtSelection(
  currentValue: string,
  variableKey: string,
  selectionStart: number | null,
  selectionEnd: number | null,
): SubjectVariableInsertResult {
  const nextToken = getTemplateVariableToken(variableKey);
  const safeStart = selectionStart ?? currentValue.length;
  const safeEnd = selectionEnd ?? safeStart;

  return {
    nextValue: `${currentValue.slice(0, safeStart)}${nextToken}${currentValue.slice(safeEnd)}`,
    nextSelectionStart: safeStart + nextToken.length,
    nextSelectionEnd: safeStart + nextToken.length,
  };
}
