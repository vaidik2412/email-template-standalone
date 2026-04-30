import type { SerializedMessageTemplate } from '@/types/messageTemplate';
import { WHATSAPP_LANGUAGES } from '@/data/whatsapp/languages';
import { buildWhatsappSubmissionPayload } from '@/utils/whatsappTemplateTranslation';

import type {
  AisensyCallToActionButton,
  AisensyCreateTemplatePayload,
  AisensyTemplateCategory,
} from './client';

/**
 * AiSensy's create-template endpoint expects the human-readable language label
 * (e.g. "English", "Afrikaans"), not the ISO code we store in `whatsapp.language`.
 * Empty/unknown codes return null so the caller can fall back to the default.
 */
function aisensyLanguageLabel(code: string | undefined): string | null {
  if (!code) return null;
  const match = WHATSAPP_LANGUAGES.find((lang) => lang.code === code);
  return match?.label ?? null;
}

/* AiSensy/Meta template names: lowercase alphanumeric + underscore. */
const NAME_SLUG_RE = /[^a-z0-9_]/g;

export function buildAisensyTemplateName(template: SerializedMessageTemplate): string {
  const stem =
    (template.name || 'template')
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(NAME_SLUG_RE, '')
      .slice(0, 64) || 'template';
  const idSuffix = template._id.slice(-8).toLowerCase().replace(NAME_SLUG_RE, '0');
  return `refrens_${stem}_${idSuffix}`;
}

/**
 * AiSensy `sample_text` format: each `{{n}}` placeholder is replaced by
 * `[example_value]` — square brackets are required and indicate to Meta which
 * substring is a sample. Brackets may NOT appear in the `text` field itself.
 *
 *   text:        "Hello {{1}}, your invoice {{2}} is ready"
 *   examples:    ["there", "INV-2026-001"]
 *   sample_text: "Hello [there], your invoice [INV-2026-001] is ready"
 */
function renderSampleWithBrackets(text: string, examples: string[]): string {
  return text.replace(/\{\{(\d+)\}\}/g, (_match, idx) => {
    const value = examples[Number(idx) - 1];
    return `[${value || `example_${idx}`}]`;
  });
}

/**
 * Convert a stored MessageTemplate into the AiSensy create-template body
 * (flat shape, not Meta components — see Stoplight `Submit WhatsApp Template Message`).
 */
export function buildAisensyCreatePayload(
  template: SerializedMessageTemplate,
  previewValueMap: Record<string, string> = {},
): AisensyCreateTemplatePayload {
  const wa = template.whatsapp;
  if (!wa) {
    throw new Error('Template is missing WhatsApp config');
  }

  const submission = buildWhatsappSubmissionPayload({
    body: template.body,
    header: wa.header,
    footer: wa.footer,
    buttonLabel: wa.button?.label,
    buttonUrl: wa.button?.url,
    previewValueMap,
  });

  const category = (wa.category as AisensyTemplateCategory) || 'UTILITY';
  const bodyExamples = submission.body.exampleValues;

  const payload: AisensyCreateTemplatePayload = {
    name: buildAisensyTemplateName(template),
    label: template.name,
    category,
    language: aisensyLanguageLabel(wa.language) || 'English',
    type: submission.header ? 'TEXT' : 'NONE',
    text: submission.body.translatedText,
    sample_text: renderSampleWithBrackets(submission.body.translatedText, bodyExamples),
    message_action_type: submission.button ? 'CTA' : 'NONE',
    quick_replies: null,
  };

  if (submission.header) {
    payload.header_text = submission.header.translatedText;
    if (submission.header.exampleValue) {
      payload.sample_header_text = renderSampleWithBrackets(submission.header.translatedText, [
        submission.header.exampleValue,
      ]);
    }
  }

  if (submission.footer) {
    payload.footer = submission.footer;
  }

  if (submission.button) {
    // Mirroring prod's `createInvoiceShareTemplate`: the AiSensy/Meta CTA URL
    // must be a real URL — `{{1}}` alone is rejected ("Call to action field
    // invalid"). Three shapes show up in the wild:
    //   (a) URL has a static prefix + a placeholder, e.g. `https://x.com/{{1}}`
    //       → keep as-is, Meta substitutes the variable at send time.
    //   (b) URL is *entirely* a placeholder (our prototype's case where users
    //       store `{{document.share_link}}` directly) AND the example value is
    //       a full URL → decompose: take everything up to the last path
    //       segment as the static prefix, register
    //       `<prefix>/{{1}}` for the button's own dynamic URL suffix.
    //   (c) Same as (b) but no example value to decompose → fall back to the
    //       bare URL string we have. Meta will reject; the form error shows
    //       a clear message to the user.
    const translatedUrl = submission.button.translatedUrl;
    const exampleValue = submission.button.exampleValue || '';
    const hasStaticPrefix = /^https?:\/\/[^{}]/.test(translatedUrl);

    let ctaUrl: string;
    if (hasStaticPrefix) {
      // (a)
      ctaUrl = translatedUrl;
    } else if (exampleValue && /^https?:\/\//.test(exampleValue)) {
      // (b) — decompose the example URL: everything before the final path
      // segment becomes the static prefix; the segment becomes the value
      // a runtime variable would substitute.
      const lastSlash = exampleValue.lastIndexOf('/');
      if (lastSlash > 'https://'.length) {
        const prefix = exampleValue.slice(0, lastSlash + 1);
        ctaUrl = `${prefix}{{1}}`;
      } else {
        ctaUrl = exampleValue;
      }
    } else {
      // (c) — best-effort: send the example value as a static URL.
      ctaUrl = exampleValue || translatedUrl;
    }

    const cta: AisensyCallToActionButton = {
      type: 'URL',
      button_title: submission.button.label,
      button_value: ctaUrl,
    };
    payload.call_to_action = [cta];
  } else {
    payload.call_to_action = null;
  }

  return payload;
}
