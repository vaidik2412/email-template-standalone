import {
  normalizeTemplateCtaColor,
  DEFAULT_TEMPLATE_CTA_BACKGROUND_COLOR,
  DEFAULT_TEMPLATE_CTA_TEXT_COLOR,
} from './templateCtaColors';

export type TemplateCtaSegment =
  | {
      type: 'markdown';
      value: string;
    }
  | {
      type: 'cta';
      raw: string;
      label: string;
      url: string;
      backgroundColor: string | null;
      textColor: string | null;
    }
  | {
      type: 'invalidCta';
      raw: string;
    };

type TemplateCtaTokenInput = {
  label: string;
  url: string;
  backgroundColor?: string | null;
  textColor?: string | null;
};

type TemplateCtaCandidate = {
  raw: string;
  start: number;
  end: number;
};

const TEMPLATE_CTA_START = '{{cta';

function escapeTemplateCtaAttributeValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function unescapeTemplateCtaAttributeValue(value: string) {
  return value.replace(/\\(["\\])/g, '$1');
}

function findTemplateCtaCandidates(value: string) {
  const candidates: TemplateCtaCandidate[] = [];
  let searchIndex = 0;

  while (searchIndex < value.length) {
    const start = value.indexOf(TEMPLATE_CTA_START, searchIndex);

    if (start === -1) {
      break;
    }

    let cursor = start + TEMPLATE_CTA_START.length;
    let inQuotes = false;
    let isEscaped = false;
    let end = -1;

    while (cursor < value.length) {
      const character = value[cursor];

      if (character === '"' && !isEscaped) {
        inQuotes = !inQuotes;
      }

      if (!inQuotes && character === '}' && value[cursor + 1] === '}') {
        end = cursor + 2;
        break;
      }

      if (character === '\\' && !isEscaped) {
        isEscaped = true;
      } else {
        isEscaped = false;
      }

      cursor += 1;
    }

    if (end === -1) {
      candidates.push({
        raw: value.slice(start),
        start,
        end: value.length,
      });
      break;
    }

    candidates.push({
      raw: value.slice(start, end),
      start,
      end,
    });

    searchIndex = end;
  }

  return candidates;
}

function parseTemplateCtaToken(token: string) {
  if (!token.startsWith(TEMPLATE_CTA_START) || !token.endsWith('}}')) {
    return null;
  }

  const attributesSource = token.slice(TEMPLATE_CTA_START.length, -2).trim();
  const attributes: Partial<TemplateCtaTokenInput> = {};
  let cursor = 0;

  while (cursor < attributesSource.length) {
    while (/\s/.test(attributesSource[cursor] || '')) {
      cursor += 1;
    }

    if (cursor >= attributesSource.length) {
      break;
    }

    const keyMatch = /^([a-zA-Z][\w-]*)\s*=\s*"/.exec(attributesSource.slice(cursor));

    if (!keyMatch) {
      return null;
    }

    const key = keyMatch[1];

    if (key !== 'label' && key !== 'url' && key !== 'backgroundColor' && key !== 'textColor') {
      if (key !== 'bg' && key !== 'text') {
        return null;
      }
    }

    const normalizedKey =
      key === 'bg'
        ? 'backgroundColor'
        : key === 'text'
          ? 'textColor'
          : key;

    if (
      normalizedKey !== 'label' &&
      normalizedKey !== 'url' &&
      normalizedKey !== 'backgroundColor' &&
      normalizedKey !== 'textColor'
    ) {
      return null;
    }

    if (attributes[normalizedKey]) {
      return null;
    }

    cursor += keyMatch[0].length;

    let value = '';
    let closed = false;
    let isEscaped = false;

    while (cursor < attributesSource.length) {
      const character = attributesSource[cursor];

      if (character === '"' && !isEscaped) {
        closed = true;
        cursor += 1;
        break;
      }

      if (character === '\\' && !isEscaped) {
        isEscaped = true;
      } else {
        value += character;
        isEscaped = false;
      }

      cursor += 1;
    }

    if (!closed) {
      return null;
    }

    attributes[normalizedKey] = unescapeTemplateCtaAttributeValue(value).trim();
  }

  if (!attributes.label || !attributes.url) {
    return null;
  }

  const normalizedBackgroundColor =
    typeof attributes.backgroundColor === 'string' && attributes.backgroundColor.length
      ? normalizeTemplateCtaColor(attributes.backgroundColor)
      : null;
  const normalizedTextColor =
    typeof attributes.textColor === 'string' && attributes.textColor.length
      ? normalizeTemplateCtaColor(attributes.textColor)
      : null;

  if (attributes.backgroundColor && !normalizedBackgroundColor) {
    return null;
  }

  if (attributes.textColor && !normalizedTextColor) {
    return null;
  }

  return {
    label: attributes.label,
    url: attributes.url,
    backgroundColor: normalizedBackgroundColor,
    textColor: normalizedTextColor,
  };
}

export function buildTemplateCtaToken({
  label,
  url,
  backgroundColor = DEFAULT_TEMPLATE_CTA_BACKGROUND_COLOR,
  textColor = DEFAULT_TEMPLATE_CTA_TEXT_COLOR,
}: TemplateCtaTokenInput) {
  const normalizedLabel = escapeTemplateCtaAttributeValue(label.trim());
  const normalizedUrl = escapeTemplateCtaAttributeValue(url.trim());
  const normalizedBackgroundColorValue =
    normalizeTemplateCtaColor(backgroundColor) || DEFAULT_TEMPLATE_CTA_BACKGROUND_COLOR;
  const normalizedTextColorValue =
    normalizeTemplateCtaColor(textColor) || DEFAULT_TEMPLATE_CTA_TEXT_COLOR;

  return `{{cta label="${normalizedLabel}" url="${normalizedUrl}" bg="${normalizedBackgroundColorValue}" text="${normalizedTextColorValue}"}}`;
}

export function parseTemplateCtaSegments(value: string): TemplateCtaSegment[] {
  const candidates = findTemplateCtaCandidates(value);

  if (!candidates.length) {
    return [
      {
        type: 'markdown',
        value,
      },
    ];
  }

  const segments: TemplateCtaSegment[] = [];
  let cursor = 0;

  for (const candidate of candidates) {
    if (candidate.start > cursor) {
      segments.push({
        type: 'markdown',
        value: value.slice(cursor, candidate.start),
      });
    }

    const parsedToken = parseTemplateCtaToken(candidate.raw);

    if (!parsedToken) {
      segments.push({
        type: 'invalidCta',
        raw: candidate.raw,
      });
    } else {
      segments.push({
        type: 'cta',
        raw: candidate.raw,
        label: parsedToken.label,
        url: parsedToken.url,
        backgroundColor: parsedToken.backgroundColor,
        textColor: parsedToken.textColor,
      });
    }

    cursor = candidate.end;
  }

  if (cursor < value.length) {
    segments.push({
      type: 'markdown',
      value: value.slice(cursor),
    });
  }

  return segments.filter((segment) => segment.type !== 'markdown' || segment.value.length > 0);
}

export function findInvalidTemplateCtaTokens(value: string) {
  return parseTemplateCtaSegments(value)
    .filter((segment): segment is Extract<TemplateCtaSegment, { type: 'invalidCta' }> => {
      return segment.type === 'invalidCta';
    })
    .map((segment) => segment.raw);
}

export function hasTemplateCtaTokens(value: string) {
  return value.includes(TEMPLATE_CTA_START);
}
