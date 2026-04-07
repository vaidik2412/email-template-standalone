import { describe, expect, it } from 'vitest';

import { getServerConfig, getOpenAIApiKey, getOpenAIModel } from '../config';
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

  it('returns the resolved config with optional openaiApiKey', () => {
    expect(getServerConfig({
      MONGODB_URI: 'mongodb://localhost:27017/email-templates',
      APP_OPENAI_API_KEY: 'sk-openai-test-key',
    })).toEqual({
      mongodbUri: 'mongodb://localhost:27017/email-templates',
      openaiApiKey: 'sk-openai-test-key',
    });
  });

  it('returns config without openaiApiKey when not set', () => {
    expect(getServerConfig({
      MONGODB_URI: 'mongodb://localhost:27017/email-templates',
    })).toEqual({
      mongodbUri: 'mongodb://localhost:27017/email-templates',
      openaiApiKey: undefined,
    });
  });

  it('getOpenAIApiKey throws when key is missing', () => {
    expect(() => getOpenAIApiKey({})).toThrow('APP_OPENAI_API_KEY is required');
  });

  it('getOpenAIApiKey returns APP_OPENAI_API_KEY when set', () => {
    expect(getOpenAIApiKey({ APP_OPENAI_API_KEY: 'sk-openai-test' })).toBe('sk-openai-test');
  });

  it('getOpenAIApiKey falls back to OPENAI_API_KEY', () => {
    expect(getOpenAIApiKey({ OPENAI_API_KEY: 'sk-openai-fallback' })).toBe('sk-openai-fallback');
  });

  it('getOpenAIModel returns default model when not configured', () => {
    expect(getOpenAIModel({})).toBe('gpt-4o-mini');
  });

  it('getOpenAIModel returns configured model', () => {
    expect(getOpenAIModel({ APP_OPENAI_MODEL: 'gpt-5.4-nano' })).toBe('gpt-5.4-nano');
  });
});
