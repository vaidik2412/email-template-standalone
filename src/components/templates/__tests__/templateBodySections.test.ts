import { describe, expect, it } from 'vitest';

import {
  DEFAULT_EMAIL_SIGNATURE,
  composeTemplateBodyWithSignature,
  splitTemplateBodySections,
} from '../templateBodySections';

describe('splitTemplateBodySections', () => {
  it('splits stored template body into body and signature using the front-end separator', () => {
    expect(splitTemplateBodySections('Hello Rahul,\n\n\nBest regards,\nTeam Refrens')).toEqual({
      body: 'Hello Rahul,',
      signature: 'Best regards,\nTeam Refrens',
    });
  });

  it('falls back to the default signature when no signature separator exists', () => {
    expect(splitTemplateBodySections('Hello Rahul,')).toEqual({
      body: 'Hello Rahul,',
      signature: DEFAULT_EMAIL_SIGNATURE,
    });
  });
});

describe('composeTemplateBodyWithSignature', () => {
  it('appends the signature block to the email body with a plain separator', () => {
    expect(composeTemplateBodyWithSignature('Hello Rahul,', 'Regards,\nRefrens Demo Business')).toBe(
      'Hello Rahul,\n\n\nRegards,\nRefrens Demo Business',
    );
  });

  it('returns just the body when the signature is blank', () => {
    expect(composeTemplateBodyWithSignature('Hello Rahul,', '   ')).toBe('Hello Rahul,');
  });
});
