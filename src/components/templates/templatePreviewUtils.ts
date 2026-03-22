import type { TemplateVariableOption } from '@/types/templateVariable';
import { removeMarkdownEditorsInternalVariables } from '@/utils/removeMarkdownEditorsInternalVariables';
import { CRM_TEMPLATE_PREVIEW_VALUES } from '@/data/email/templateVariables';

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
  ...CRM_TEMPLATE_PREVIEW_VALUES,
};

const TEMPLATE_VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

export function buildTemplatePreviewValueMap(variableOptions: TemplateVariableOption[]) {
  return variableOptions.reduce<Record<string, string>>((acc, option) => {
    if (typeof option.sampleValue === 'string' && option.sampleValue) {
      acc[option.value] = option.sampleValue;
    }

    return acc;
  }, {});
}

export function resolveTemplatePreviewText(
  value: string,
  previewVariableValues: Record<string, string> = PREVIEW_VARIABLE_VALUES,
) {
  const normalizedValue = removeMarkdownEditorsInternalVariables(value);

  return normalizedValue.replace(TEMPLATE_VARIABLE_PATTERN, (match, token: string) => {
    return previewVariableValues[token] ?? match;
  });
}

export function getTemplateVariableToken(variableKey: string) {
  return `{{${variableKey}}}`;
}

export function insertTextAtSelection(
  currentValue: string,
  nextText: string,
  selectionStart: number | null,
  selectionEnd: number | null,
): SubjectVariableInsertResult {
  const safeStart = selectionStart ?? currentValue.length;
  const safeEnd = selectionEnd ?? safeStart;

  return {
    nextValue: `${currentValue.slice(0, safeStart)}${nextText}${currentValue.slice(safeEnd)}`,
    nextSelectionStart: safeStart + nextText.length,
    nextSelectionEnd: safeStart + nextText.length,
  };
}

export function insertTemplateVariableAtSelection(
  currentValue: string,
  variableKey: string,
  selectionStart: number | null,
  selectionEnd: number | null,
) {
  return insertTextAtSelection(
    currentValue,
    getTemplateVariableToken(variableKey),
    selectionStart,
    selectionEnd,
  );
}
