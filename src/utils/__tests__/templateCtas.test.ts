import { describe, expect, it } from 'vitest';

import {
  buildTemplateCtaToken,
  findInvalidTemplateCtaTokens,
  parseTemplateCtaSegments,
} from '../templateCtas';

describe('buildTemplateCtaToken', () => {
  it('builds a CTA token with escaped values and color attributes', () => {
    expect(
      buildTemplateCtaToken({
        label: 'Pay "Now"',
        url: 'https://example.com/invoices/"abc"',
        backgroundColor: '#4F46E5',
        textColor: '#FFFFFF',
      }),
    ).toBe(
      '{{cta label="Pay \\"Now\\"" url="https://example.com/invoices/\\"abc\\"" bg="#4f46e5" text="#ffffff"}}',
    );
  });
});

describe('parseTemplateCtaSegments', () => {
  it('extracts valid CTA blocks alongside markdown text', () => {
    expect(
      parseTemplateCtaSegments(
        'Before\n\n{{cta label="Pay invoice" url="https://pay.test/{{document.number}}" bg="#0f172a" text="#ffffff"}}\n\nAfter',
      ),
    ).toEqual([
      {
        type: 'markdown',
        value: 'Before\n\n',
      },
      {
        type: 'cta',
        raw: '{{cta label="Pay invoice" url="https://pay.test/{{document.number}}" bg="#0f172a" text="#ffffff"}}',
        label: 'Pay invoice',
        url: 'https://pay.test/{{document.number}}',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
      },
      {
        type: 'markdown',
        value: '\n\nAfter',
      },
    ]);
  });

  it('keeps old CTA tokens valid when colors are absent', () => {
    expect(parseTemplateCtaSegments('{{cta label="Pay invoice" url="https://pay.test"}}')).toEqual([
      {
        type: 'cta',
        raw: '{{cta label="Pay invoice" url="https://pay.test"}}',
        label: 'Pay invoice',
        url: 'https://pay.test',
        backgroundColor: null,
        textColor: null,
      },
    ]);
  });
});

describe('findInvalidTemplateCtaTokens', () => {
  it('flags malformed CTA tokens with missing required attributes', () => {
    expect(findInvalidTemplateCtaTokens('{{cta label="Pay invoice"}}')).toEqual([
      '{{cta label="Pay invoice"}}',
    ]);
  });

  it('flags malformed CTA tokens with invalid hex colors', () => {
    expect(
      findInvalidTemplateCtaTokens(
        '{{cta label="Pay invoice" url="https://pay.test" bg="purple" text="#ffffff"}}',
      ),
    ).toEqual(['{{cta label="Pay invoice" url="https://pay.test" bg="purple" text="#ffffff"}}']);
  });
});
