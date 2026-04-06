export type WhatsappLanguage = {
  code: string;
  label: string;
};

export const WHATSAPP_LANGUAGES: WhatsappLanguage[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt_BR', label: 'Portuguese (BR)' },
  { code: 'ar', label: 'Arabic' },
  { code: 'id', label: 'Indonesian' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh_CN', label: 'Chinese (Simplified)' },
];

export const WHATSAPP_LANGUAGE_CODES = WHATSAPP_LANGUAGES.map((lang) => lang.code);

export function isValidWhatsappLanguage(code: string): boolean {
  return WHATSAPP_LANGUAGE_CODES.includes(code);
}
