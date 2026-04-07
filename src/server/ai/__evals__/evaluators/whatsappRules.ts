import type { GenerateTemplateResult } from '../../generateTemplate';
import { WHATSAPP_LANGUAGE_CODES } from '@/data/whatsapp/languages';
import type { EvalScore } from './structural';

export function plainTextBody(result: GenerateTemplateResult): EvalScore {
  const body = result.body || '';
  const markdownPatterns = [
    /\*\*[^*]+\*\*/,   // **bold**
    /__[^_]+__/,        // __bold__
    /^#{1,6}\s/m,       // # heading
    /\[([^\]]+)\]\(/,   // [link](url)
  ];

  const foundMarkdown = markdownPatterns.filter((p) => p.test(body));

  return {
    key: 'plain_text_body',
    score: foundMarkdown.length === 0 ? 1 : 0,
    comment: foundMarkdown.length > 0 ? 'WhatsApp body contains markdown formatting' : undefined,
  };
}

export function bodyUnder1024(result: GenerateTemplateResult): EvalScore {
  const length = (result.body || '').length;
  return {
    key: 'body_under_1024',
    score: length <= 1024 ? 1 : 0,
    comment: length > 1024 ? `Body is ${length} chars, max is 1024` : undefined,
  };
}

export function noCtaInBody(result: GenerateTemplateResult): EvalScore {
  const body = result.body || '';
  const hasCta = /\{\{cta\s/.test(body);
  return {
    key: 'no_cta_in_body',
    score: hasCta ? 0 : 1,
    comment: hasCta ? 'WhatsApp body contains {{cta ...}} token' : undefined,
  };
}

export function headerLength(result: GenerateTemplateResult): EvalScore {
  if (!result.whatsappHeader) {
    return { key: 'header_length', score: 1 };
  }

  const length = result.whatsappHeader.length;
  return {
    key: 'header_length',
    score: length <= 60 ? 1 : 0,
    comment: length > 60 ? `Header is ${length} chars, max is 60` : undefined,
  };
}

export function footerLength(result: GenerateTemplateResult): EvalScore {
  if (!result.whatsappFooter) {
    return { key: 'footer_length', score: 1 };
  }

  const length = result.whatsappFooter.length;
  return {
    key: 'footer_length',
    score: length <= 60 ? 1 : 0,
    comment: length > 60 ? `Footer is ${length} chars, max is 60` : undefined,
  };
}

export function footerNoVariables(result: GenerateTemplateResult): EvalScore {
  if (!result.whatsappFooter) {
    return { key: 'footer_no_variables', score: 1 };
  }

  const hasVars = /\{\{[^}]+\}\}/.test(result.whatsappFooter);
  return {
    key: 'footer_no_variables',
    score: hasVars ? 0 : 1,
    comment: hasVars ? 'Footer contains variable tokens' : undefined,
  };
}

export function buttonLabelLength(result: GenerateTemplateResult): EvalScore {
  if (!result.whatsappButton?.label) {
    return { key: 'button_label_length', score: 1 };
  }

  const length = result.whatsappButton.label.length;
  return {
    key: 'button_label_length',
    score: length <= 20 ? 1 : 0,
    comment: length > 20 ? `Button label is ${length} chars, max is 20` : undefined,
  };
}

export function validLanguageCode(result: GenerateTemplateResult): EvalScore {
  if (!result.whatsappLanguage) {
    return {
      key: 'valid_language_code',
      score: 0,
      comment: 'WhatsApp template missing language code',
    };
  }

  const valid = WHATSAPP_LANGUAGE_CODES.includes(result.whatsappLanguage);
  return {
    key: 'valid_language_code',
    score: valid ? 1 : 0,
    comment: valid ? undefined : `Invalid language code: ${result.whatsappLanguage}`,
  };
}

export function validCategory(result: GenerateTemplateResult): EvalScore {
  if (!result.whatsappCategory) {
    return {
      key: 'valid_category',
      score: 0,
      comment: 'WhatsApp template missing category',
    };
  }

  const valid = result.whatsappCategory === 'MARKETING' || result.whatsappCategory === 'UTILITY';
  return {
    key: 'valid_category',
    score: valid ? 1 : 0,
    comment: valid ? undefined : `Invalid category: ${result.whatsappCategory}`,
  };
}

export function noBrandingFooter(result: GenerateTemplateResult): EvalScore {
  if (!result.whatsappFooter) {
    return { key: 'no_branding_footer', score: 1 };
  }

  const lower = result.whatsappFooter.toLowerCase();
  const hasBranding = lower.includes('refrens') || lower.includes('powered by');
  return {
    key: 'no_branding_footer',
    score: hasBranding ? 0 : 1,
    comment: hasBranding ? `Footer contains branding: "${result.whatsappFooter}"` : undefined,
  };
}

export function runWhatsappEvals(result: GenerateTemplateResult): EvalScore[] {
  return [
    plainTextBody(result),
    bodyUnder1024(result),
    noCtaInBody(result),
    headerLength(result),
    footerLength(result),
    footerNoVariables(result),
    buttonLabelLength(result),
    validLanguageCode(result),
    validCategory(result),
    noBrandingFooter(result),
  ];
}
