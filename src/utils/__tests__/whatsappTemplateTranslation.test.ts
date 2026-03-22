import { describe, expect, it } from 'vitest';

import { translateWhatsappTemplateBody } from '../whatsappTemplateTranslation';

describe('translateWhatsappTemplateBody', () => {
  it('converts named variables into ordered positional placeholders', () => {
    expect(
      translateWhatsappTemplateBody(
        'Hello {{contact.name}}, invoice {{document.number}} is due.',
      ),
    ).toEqual({
      translatedBody: 'Hello {{1}}, invoice {{2}} is due.',
      orderedVariables: ['contact.name', 'document.number'],
      exampleValues: expect.any(Array),
    });
  });

  it('reuses the same placeholder for repeated variables', () => {
    expect(
      translateWhatsappTemplateBody(
        'Hello {{contact.name}}, confirming for {{contact.name}}.',
      ),
    ).toMatchObject({
      translatedBody: 'Hello {{1}}, confirming for {{1}}.',
      orderedVariables: ['contact.name'],
    });
  });
});
