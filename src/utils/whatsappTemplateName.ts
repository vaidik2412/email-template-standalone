const WHATSAPP_TEMPLATE_NAME_PATTERN = /^[a-z0-9_]+$/;

export function normalizeWhatsappTemplateNameInput(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+/g, '');
}

export function normalizeWhatsappTemplateName(value: string) {
  return normalizeWhatsappTemplateNameInput(value.trim()).replace(/_+$/g, '');
}

export function isWhatsappTemplateNameSafe(value: string) {
  return WHATSAPP_TEMPLATE_NAME_PATTERN.test(value);
}
