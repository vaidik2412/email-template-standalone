import type { GenerateTemplateResult } from '../../generateTemplate';
import type { EvalExpected } from '../dataset';

export type EvalScore = {
  key: string;
  score: 0 | 1;
  comment?: string;
};

export function validJson(result: GenerateTemplateResult): EvalScore {
  const hasName = typeof result.name === 'string' && result.name.length > 0;
  const hasBody = typeof result.body === 'string' && result.body.length > 0;
  const hasChannel = result.channel === 'EMAIL' || result.channel === 'WHATSAPP';
  const hasTemplateType = typeof result.templateType === 'string' && result.templateType.length > 0;

  const pass = hasName && hasBody && hasChannel && hasTemplateType;

  return {
    key: 'valid_json',
    score: pass ? 1 : 0,
    comment: pass
      ? undefined
      : `Missing: ${[!hasName && 'name', !hasBody && 'body', !hasChannel && 'channel', !hasTemplateType && 'templateType'].filter(Boolean).join(', ')}`,
  };
}

export function correctChannel(result: GenerateTemplateResult, expected: EvalExpected): EvalScore {
  if (!expected.channel) {
    return { key: 'correct_channel', score: 1 };
  }

  return {
    key: 'correct_channel',
    score: result.channel === expected.channel ? 1 : 0,
    comment: result.channel !== expected.channel ? `Expected ${expected.channel}, got ${result.channel}` : undefined,
  };
}

export function correctTemplateType(result: GenerateTemplateResult, expected: EvalExpected): EvalScore {
  if (!expected.templateType) {
    return { key: 'correct_template_type', score: 1 };
  }

  return {
    key: 'correct_template_type',
    score: result.templateType === expected.templateType ? 1 : 0,
    comment: result.templateType !== expected.templateType
      ? `Expected ${expected.templateType}, got ${result.templateType}`
      : undefined,
  };
}

export function correctDocumentSubtype(result: GenerateTemplateResult, expected: EvalExpected): EvalScore {
  if (!expected.documentSubtype) {
    return { key: 'correct_document_subtype', score: 1 };
  }

  return {
    key: 'correct_document_subtype',
    score: result.documentSubtype === expected.documentSubtype ? 1 : 0,
    comment: result.documentSubtype !== expected.documentSubtype
      ? `Expected ${expected.documentSubtype}, got ${result.documentSubtype || 'undefined'}`
      : undefined,
  };
}

export function nameLength(result: GenerateTemplateResult): EvalScore {
  const wordCount = result.name.trim().split(/\s+/).length;
  const pass = wordCount >= 2 && wordCount <= 8;

  return {
    key: 'name_length',
    score: pass ? 1 : 0,
    comment: pass ? undefined : `Name has ${wordCount} words, expected 2-8`,
  };
}

export function subjectRules(result: GenerateTemplateResult): EvalScore {
  if (result.channel === 'EMAIL') {
    const hasSubject = typeof result.subject === 'string' && result.subject.trim().length > 0;
    return {
      key: 'subject_rules',
      score: hasSubject ? 1 : 0,
      comment: hasSubject ? undefined : 'EMAIL template missing subject',
    };
  }

  const emptySubject = !result.subject || result.subject.trim() === '';
  return {
    key: 'subject_rules',
    score: emptySubject ? 1 : 0,
    comment: emptySubject ? undefined : 'WHATSAPP template should have empty subject',
  };
}

export function signatureRules(result: GenerateTemplateResult): EvalScore {
  if (result.channel === 'WHATSAPP' && result.signature) {
    return {
      key: 'signature_rules',
      score: 0,
      comment: 'WHATSAPP template should not have a signature',
    };
  }

  return { key: 'signature_rules', score: 1 };
}

export function bodyNonEmpty(result: GenerateTemplateResult): EvalScore {
  const pass = typeof result.body === 'string' && result.body.trim().length >= 20;
  return {
    key: 'body_non_empty',
    score: pass ? 1 : 0,
    comment: pass ? undefined : `Body too short (${result.body?.length || 0} chars)`,
  };
}

const SIGN_OFF_PATTERNS = [
  /regards\s*$/i,
  /best regards\s*$/i,
  /thank you\s*$/i,
  /thanks\s*$/i,
  /sincerely\s*$/i,
  /warm regards\s*$/i,
  /cheers\s*$/i,
];

export function noSignOffInBody(result: GenerateTemplateResult): EvalScore {
  const trimmedBody = result.body.trim();
  const lastLine = trimmedBody.split('\n').pop()?.trim() || '';

  const hasSignOff = SIGN_OFF_PATTERNS.some((pattern) => pattern.test(lastLine));

  return {
    key: 'no_sign_off_in_body',
    score: hasSignOff ? 0 : 1,
    comment: hasSignOff ? `Body ends with sign-off: "${lastLine}"` : undefined,
  };
}

export function runStructuralEvals(result: GenerateTemplateResult, expected: EvalExpected): EvalScore[] {
  return [
    validJson(result),
    correctChannel(result, expected),
    correctTemplateType(result, expected),
    correctDocumentSubtype(result, expected),
    nameLength(result),
    subjectRules(result),
    signatureRules(result),
    bodyNonEmpty(result),
    noSignOffInBody(result),
  ];
}
