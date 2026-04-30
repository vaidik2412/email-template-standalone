import { describe, expect, it } from 'vitest';

import {
  isWhatsappTemplateNameSafe,
  normalizeWhatsappTemplateNameInput,
  normalizeWhatsappTemplateName,
} from '../whatsappTemplateName';

describe('normalizeWhatsappTemplateName', () => {
  it('converts a readable name into a WhatsApp-safe identifier', () => {
    expect(normalizeWhatsappTemplateName('Invoice Share Reminder')).toBe(
      'invoice_share_reminder',
    );
  });

  it('collapses punctuation and repeated separators into one underscore', () => {
    expect(normalizeWhatsappTemplateName('  Invoice #42: Follow-up!!  ')).toBe(
      'invoice_42_follow_up',
    );
  });
});

describe('isWhatsappTemplateNameSafe', () => {
  it('accepts only lowercase letters, numbers, and underscores', () => {
    expect(isWhatsappTemplateNameSafe('invoice_share_42')).toBe(true);
    expect(isWhatsappTemplateNameSafe('Invoice Share')).toBe(false);
    expect(isWhatsappTemplateNameSafe('invoice-share')).toBe(false);
  });
});

describe('normalizeWhatsappTemplateNameInput', () => {
  it('preserves a trailing underscore while the user is still typing', () => {
    expect(normalizeWhatsappTemplateNameInput('invoice_')).toBe('invoice_');
  });
});
