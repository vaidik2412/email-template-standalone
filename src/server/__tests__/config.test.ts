import { describe, expect, it } from 'vitest';

import { getServerConfig } from '../config';
import { FIXED_APP_CONTEXT } from '../constants/fixedContext';

describe('server config', () => {
  it('requires MONGODB_URI', () => {
    expect(() => getServerConfig({})).toThrow('MONGODB_URI is required');
  });

  it('exposes a stable single-business context', () => {
    expect(FIXED_APP_CONTEXT.business.id).toMatch(/^[a-f0-9]{24}$/);
    expect(FIXED_APP_CONTEXT.user.id).toMatch(/^[a-f0-9]{24}$/);
    expect(FIXED_APP_CONTEXT.business.urlKey).toBe('demo-business');
    expect(FIXED_APP_CONTEXT.business.name).toBe('Refrens Demo Business');
    expect(FIXED_APP_CONTEXT.user.name).toBe('Standalone Admin');
  });

  it('returns the resolved MongoDB connection string', () => {
    expect(getServerConfig({ MONGODB_URI: 'mongodb://localhost:27017/email-templates' })).toEqual({
      mongodbUri: 'mongodb://localhost:27017/email-templates',
    });
  });
});
