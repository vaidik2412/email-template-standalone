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
  'document.share_link',
  'document.amount_paid',
  'document.amount_due',
  'customer.name',
  'customer.email',
  'customer.phone',
  'business.name',
  'business.email',
  'business.phone',
]);

const VARIABLE_PATTERN = /\{\{([a-z_]+\.[a-z_]+)\}\}/gi;

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

export function currencyBeforeAmount(result: GenerateTemplateResult): EvalScore {
  const body = result.body || '';
  const amountVars = ['document.total', 'document.amount_due', 'document.amount_paid'];

  for (const amountVar of amountVars) {
    const amountToken = `{{${amountVar}}}`;
    const currencyToken = '{{document.currency}}';

    if (!body.includes(amountToken)) {
      continue;
    }

    const amountIndex = body.indexOf(amountToken);
    // Find the closest preceding currency token
    const precedingText = body.substring(0, amountIndex);
    const lastCurrencyIndex = precedingText.lastIndexOf(currencyToken);

    if (lastCurrencyIndex === -1) {
      return {
        key: 'currency_before_amount',
        score: 0,
        comment: `${amountToken} used without preceding ${currencyToken}`,
      };
    }

    // Verify currency is close to amount (within ~50 chars, on same line)
    const gap = amountIndex - (lastCurrencyIndex + currencyToken.length);
    if (gap > 50) {
      return {
        key: 'currency_before_amount',
        score: 0,
        comment: `${currencyToken} too far from ${amountToken} (${gap} chars apart)`,
      };
    }
  }

  return { key: 'currency_before_amount', score: 1 };
}

export function runVariableEvals(result: GenerateTemplateResult): EvalScore[] {
  return [
    onlyAllowedVariables(result),
    noHallucinatedVariables(result),
    currencyBeforeAmount(result),
  ];
}
