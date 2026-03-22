import { parseTemplateCtaSegments } from './templateCtas';

const TEMPLATE_VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

function extractTemplateVariableKeysFromSegment(value: string) {
  const matches = value.matchAll(TEMPLATE_VARIABLE_PATTERN);
  const keys = Array.from(matches, ([, token]) => token.trim()).filter(Boolean);

  return keys;
}

export function extractTemplateVariableKeys(value: string) {
  const keys = parseTemplateCtaSegments(value).flatMap((segment) => {
    if (segment.type === 'markdown') {
      return extractTemplateVariableKeysFromSegment(segment.value);
    }

    if (segment.type === 'cta') {
      return [
        ...extractTemplateVariableKeysFromSegment(segment.label),
        ...extractTemplateVariableKeysFromSegment(segment.url),
      ];
    }

    return [];
  });

  return Array.from(new Set(keys));
}

export function findUnsupportedTemplateVariables(value: string, allowedVariableKeys: string[]) {
  if (!value.trim()) {
    return [];
  }

  const allowedKeys = new Set(allowedVariableKeys);

  return extractTemplateVariableKeys(value).filter((key) => !allowedKeys.has(key));
}
