import { describe, expect, it } from 'vitest';

import { FIXED_APP_CONTEXT } from '../../constants/fixedContext';
import { getTemplateScopeQuery, getVisibleTemplateQuery } from '../queries';

describe('template queries', () => {
  it('scopes templates to the fixed business without filtering by channel', () => {
    const query = getTemplateScopeQuery();

    expect(query.business.toString()).toBe(FIXED_APP_CONTEXT.business.id);
    expect(query).not.toHaveProperty('channel');
  });

  it('adds the visible-template removal filter without adding a channel filter', () => {
    const query = getVisibleTemplateQuery();

    expect(query.business.toString()).toBe(FIXED_APP_CONTEXT.business.id);
    expect(query.isRemoved).toBe(false);
    expect(query).not.toHaveProperty('channel');
  });
});
