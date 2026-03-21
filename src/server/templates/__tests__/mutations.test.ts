import { describe, expect, it } from 'vitest';

import { FIXED_APP_CONTEXT } from '../../constants/fixedContext';
import { applyTemplateMutation } from '../mutations';

const actorId = FIXED_APP_CONTEXT.user.id;

describe('applyTemplateMutation', () => {
  it('marks draft saves as modified post publish', () => {
    const mutation = applyTemplateMutation(
      {
        name: 'Draft template',
        subject: 'Draft subject',
        body: 'Draft body',
      },
      {
        actorId,
        isPublished: false,
      },
    );

    expect(mutation.isModifiedPostPublish).toBe(true);
    expect(mutation.status).toBeUndefined();
    expect(mutation.published).toBeUndefined();
  });

  it('copies publishable fields into published state when publishing', () => {
    const mutation = applyTemplateMutation(
      {
        name: 'Live template',
        subject: 'Live subject',
        body: 'Live body',
      },
      {
        actorId,
        isPublished: true,
      },
    );

    expect(mutation.published).toEqual({
      name: 'Live template',
      subject: 'Live subject',
      body: 'Live body',
    });
    expect(mutation.status).toBe('LIVE');
    expect(mutation.isModifiedPostPublish).toBe(false);
    expect(mutation.isArchived).toBe(false);
    expect(mutation.lastPublished).toBeInstanceOf(Date);
  });

  it('records the archiving actor when a template is archived', () => {
    const mutation = applyTemplateMutation(
      {
        isArchived: true,
      },
      {
        actorId,
        isPublished: false,
      },
    );

    expect(mutation.archived?.by?.toHexString()).toBe(actorId);
  });

  it('records the removing actor when a template is soft deleted', () => {
    const mutation = applyTemplateMutation(
      {
        isRemoved: true,
      },
      {
        actorId,
        isPublished: false,
      },
    );

    expect(mutation.removed?.by?.toHexString()).toBe(actorId);
  });
});
