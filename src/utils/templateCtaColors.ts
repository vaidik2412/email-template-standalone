export const DEFAULT_TEMPLATE_CTA_BACKGROUND_COLOR = '#4f46e5';
export const DEFAULT_TEMPLATE_CTA_TEXT_COLOR = '#ffffff';
export const TEMPLATE_CTA_RECENT_BACKGROUND_COLORS_STORAGE_KEY =
  'email-template-cta-recent-background-colors';
export const TEMPLATE_CTA_RECENT_TEXT_COLORS_STORAGE_KEY =
  'email-template-cta-recent-text-colors';

const MAX_RECENT_TEMPLATE_CTA_COLORS = 8;

type TemplateCtaColorKind = 'background' | 'text';

function getRecentTemplateCtaColorsStorageKey(kind: TemplateCtaColorKind) {
  return kind === 'background'
    ? TEMPLATE_CTA_RECENT_BACKGROUND_COLORS_STORAGE_KEY
    : TEMPLATE_CTA_RECENT_TEXT_COLORS_STORAGE_KEY;
}

export function normalizeTemplateCtaColor(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const valueWithHash = trimmedValue.startsWith('#') ? trimmedValue : `#${trimmedValue}`;

  if (!/^#[\da-fA-F]{6}$/.test(valueWithHash)) {
    return null;
  }

  return valueWithHash.toLowerCase();
}

function getBrowserStorage() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export function readRecentTemplateCtaColors(kind: TemplateCtaColorKind) {
  const storage = getBrowserStorage();

  if (!storage) {
    return [];
  }

  try {
    const storedValue = storage.getItem(getRecentTemplateCtaColorsStorageKey(kind));

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((entry) => normalizeTemplateCtaColor(typeof entry === 'string' ? entry : ''))
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, MAX_RECENT_TEMPLATE_CTA_COLORS);
  } catch {
    return [];
  }
}

export function saveRecentTemplateCtaColor(kind: TemplateCtaColorKind, color: string) {
  const storage = getBrowserStorage();
  const normalizedColor = normalizeTemplateCtaColor(color);

  if (!storage || !normalizedColor) {
    return readRecentTemplateCtaColors(kind);
  }

  const nextColors = [
    normalizedColor,
    ...readRecentTemplateCtaColors(kind).filter((entry) => entry !== normalizedColor),
  ].slice(0, MAX_RECENT_TEMPLATE_CTA_COLORS);

  try {
    storage.setItem(getRecentTemplateCtaColorsStorageKey(kind), JSON.stringify(nextColors));
  } catch {
    return nextColors;
  }

  return nextColors;
}
