import type { GenerateTemplateResult } from '../../generateTemplate';
import type { EvalScore } from './structural';

const CRM_VARIABLES = new Set([
  'contact.name',
  'contact.email',
  'contact.phone',
  'contact.country',
  'company.name',
  'my.name',
  'my.phone',
  'my.business',
  'business.name',
]);

const ACCOUNTING_VARIABLES = new Set([
  'document.type',
  'document.number',
  'document.date',
  'document.due_date',
  'document.total',
  'document.currency',
  'document.total_with_currency',
  'document.share_link',
  'document.amount_paid',
  'document.amount_due',
  'document.amount_paid_with_currency',
  'document.amount_due_with_currency',
  'customer.name',
  'customer.email',
  'customer.phone',
  'business.name',
  'business.email',
  'business.phone',
]);

const VARIABLE_PATTERN = /\{\{([a-z_]+\.[a-z_]+)\}\}/gi;
const ADJACENT_VARIABLES_PATTERN = /\{\{([^}]+)\}\}\s+\{\{([^}]+)\}\}/;

function extractVariables(text: string): string[] {
  const matches = [...text.matchAll(VARIABLE_PATTERN)];
  return [...new Set(matches.map((m) => m[1]))];
}

function getAllText(result: GenerateTemplateResult): string {
  const parts = [
    result.body || '',
    result.subject || '',
    result.name || '',
    result.signature || '',
    result.whatsappHeader || '',
    result.whatsappButton?.url || '',
  ];
  return parts.join(' ');
}

function getAllowedVariables(templateType: string): Set<string> {
  if (templateType === 'ACCOUNTING_DOCUMENTS') {
    return ACCOUNTING_VARIABLES;
  }
  return CRM_VARIABLES;
}

export function onlyAllowedVariables(result: GenerateTemplateResult): EvalScore {
  const allText = getAllText(result);
  const used = extractVariables(allText);
  const allowed = getAllowedVariables(result.templateType);

  const invalid = used.filter((v) => !allowed.has(v));

  return {
    key: 'only_allowed_variables',
    score: invalid.length === 0 ? 1 : 0,
    comment: invalid.length > 0 ? `Disallowed variables: ${invalid.join(', ')}` : undefined,
  };
}

export function noHallucinatedVariables(result: GenerateTemplateResult): EvalScore {
  const allText = getAllText(result);
  const used = extractVariables(allText);
  const allKnown = new Set([...CRM_VARIABLES, ...ACCOUNTING_VARIABLES]);

  const hallucinated = used.filter((v) => !allKnown.has(v));

  return {
    key: 'no_hallucinated_variables',
    score: hallucinated.length === 0 ? 1 : 0,
    comment: hallucinated.length > 0 ? `Hallucinated variables: ${hallucinated.join(', ')}` : undefined,
  };
}

/**
 * WhatsApp/Meta rejects body text where two `{{variable}}` placeholders are
 * separated only by whitespace (the AiSensy-surfaced error reads "Invalid
 * parameter ordering"). The `*_with_currency` variants exist so the model
 * never has to pair {{document.currency}} with a bare amount.
 */
export function noAdjacentVariables(result: GenerateTemplateResult): EvalScore {
  const body = result.body || '';
  const match = ADJACENT_VARIABLES_PATTERN.exec(body);

  if (!match) {
    return { key: 'no_adjacent_variables', score: 1 };
  }

  return {
    key: 'no_adjacent_variables',
    score: 0,
    comment: `Body has adjacent variables {{${match[1].trim()}}} and {{${match[2].trim()}}}; use a "_with_currency" variant or insert static text.`,
  };
}

export function runVariableEvals(result: GenerateTemplateResult): EvalScore[] {
  return [
    onlyAllowedVariables(result),
    noHallucinatedVariables(result),
    noAdjacentVariables(result),
  ];
}
