import { describe, expect, it } from 'vitest';

import {
  EMAIL_TEMPLATE_PREVIEW_CONTEXT,
  buildTemplatePreviewValueMap,
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

  it('resolves document and vendor field samples from the active variable catalog', () => {
    expect(
      resolveTemplatePreviewText(
        'Hello {{customer.name}} - {{vendorFields.invoice_owner}} sent {{document.number}}',
        buildTemplatePreviewValueMap([
          {
            label: 'Customer Name',
            value: 'customer.name',
            group: 'Document',
            scope: 'ACCOUNTING_DOCUMENTS',
            sampleValue: 'Aarav Industries',
          },
          {
            label: 'Invoice Owner',
            value: 'vendorFields.invoice_owner',
            group: 'Vendor Fields',
            scope: 'ACCOUNTING_DOCUMENTS',
            sampleValue: 'Sample Invoice Owner',
          },
          {
            label: 'Document Number',
            value: 'document.number',
            group: 'Document',
            scope: 'ACCOUNTING_DOCUMENTS',
            sampleValue: 'INV-2026-001',
          },
        ]),
      ),
    ).toBe('Hello Aarav Industries - Sample Invoice Owner sent INV-2026-001');
  });

  it('normalizes editor line-break markup so ordered lists stay on separate lines', () => {
    expect(
      resolveTemplatePreviewText(
        '{{business.name}}\n<br>\n1. {{document.total}}\n2. {{document.amount_paid}}\n3. {{document.amount_due}}',
        buildTemplatePreviewValueMap([
          {
            label: 'Business Name',
            value: 'business.name',
            group: 'Document',
            scope: 'ACCOUNTING_DOCUMENTS',
            sampleValue: 'Refrens Demo Business',
          },
          {
            label: 'Document Total',
            value: 'document.total',
            group: 'Document',
            scope: 'ACCOUNTING_DOCUMENTS',
            sampleValue: '12,500.00',
          },
          {
            label: 'Amount Paid',
            value: 'document.amount_paid',
            group: 'Document',
            scope: 'ACCOUNTING_DOCUMENTS',
            sampleValue: '3,500.00',
          },
          {
            label: 'Amount Due',
            value: 'document.amount_due',
            group: 'Document',
            scope: 'ACCOUNTING_DOCUMENTS',
            sampleValue: '9,000.00',
          },
        ]),
      ),
    ).toBe('Refrens Demo Business\n\n1. 12,500.00\n2. 3,500.00\n3. 9,000.00');
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
