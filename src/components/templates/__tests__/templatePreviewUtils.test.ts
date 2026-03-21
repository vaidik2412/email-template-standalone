import { describe, expect, it } from 'vitest';

import {
  EMAIL_TEMPLATE_PREVIEW_CONTEXT,
  insertTemplateVariableAtSelection,
  resolveTemplatePreviewText,
} from '../templatePreviewUtils';

describe('resolveTemplatePreviewText', () => {
  it('strips editor widget placeholders before resolving known variables', () => {
    expect(
      resolveTemplatePreviewText('Hello $$widget0 {{contact.name}}$$ from {{business.name}}.'),
    ).toBe('Hello Rahul Mehta from Refrens Demo Business.');
  });

  it('keeps unsupported variables unchanged in preview output', () => {
    expect(resolveTemplatePreviewText('Hello {{contact.name}} and {{deal.owner}}')).toBe(
      'Hello Rahul Mehta and {{deal.owner}}',
    );
  });

  it('resolves sender variables from the shared preview context', () => {
    expect(resolveTemplatePreviewText('Call {{my.name}} at {{my.phone}}')).toBe(
      `Call ${EMAIL_TEMPLATE_PREVIEW_CONTEXT.sender.name} at +91 98765 00000`,
    );
  });
});

describe('insertTemplateVariableAtSelection', () => {
  it('inserts the variable token at the caret position', () => {
    expect(insertTemplateVariableAtSelection('Hello there', 'contact.name', 6, 6)).toEqual({
      nextValue: 'Hello {{contact.name}}there',
      nextSelectionStart: 22,
      nextSelectionEnd: 22,
    });
  });

  it('replaces the active selection with the variable token', () => {
    expect(insertTemplateVariableAtSelection('Hello there', 'company.name', 6, 11)).toEqual({
      nextValue: 'Hello {{company.name}}',
      nextSelectionStart: 22,
      nextSelectionEnd: 22,
    });
  });

  it('appends the token when there is no remembered caret position', () => {
    expect(insertTemplateVariableAtSelection('Hello', 'contact.email', null, null)).toEqual({
      nextValue: 'Hello{{contact.email}}',
      nextSelectionStart: 22,
      nextSelectionEnd: 22,
    });
  });
});
