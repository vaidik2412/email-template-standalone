export type ServerConfig = {
  mongodbUri: string;
  openaiApiKey?: string;
};

export type AiSensyTemplateApiConfig = {
  enabled: boolean;
  apiKey?: string;
  createUrl?: string;
  statusUrl?: string;
};

type EnvShape = Record<string, string | undefined>;

export function getServerConfig(env: EnvShape = process.env): ServerConfig {
  const mongodbUri = env.MONGODB_URI?.trim();

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required');
  }

  const openaiApiKey = env.APP_OPENAI_API_KEY?.trim() || env.OPENAI_API_KEY?.trim() || undefined;

  return {
    mongodbUri,
    openaiApiKey,
  };
}

export function getOpenAIApiKey(env: EnvShape = process.env): string {
  const apiKey = env.APP_OPENAI_API_KEY?.trim() || env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('APP_OPENAI_API_KEY is required — set it in .env.local to use AI template generation');
  }

  return apiKey;
}

export function getOpenAIModel(env: EnvShape = process.env): string {
  return env.APP_OPENAI_MODEL?.trim() || 'gpt-4o-mini';
}

export function isAiSensyTemplateApiEnabled(env: EnvShape = process.env): boolean {
  return env.AISENSY_TEMPLATE_API_ENABLED?.trim().toLowerCase() === 'true';
}

export function getAiSensyTemplateApiConfig(
  env: EnvShape = process.env,
): AiSensyTemplateApiConfig {
  const enabled = isAiSensyTemplateApiEnabled(env);
  const apiKey = env.AISENSY_PROJECT_API_KEY?.trim() || undefined;
  const createUrl = env.AISENSY_TEMPLATE_CREATE_URL?.trim() || undefined;
  const statusUrl = env.AISENSY_TEMPLATE_STATUS_URL?.trim() || undefined;

  if (!enabled) {
    return {
      enabled: false,
      apiKey,
      createUrl,
      statusUrl,
    };
  }

  if (!apiKey) {
    throw new Error('AISENSY_PROJECT_API_KEY is required when AISENSY_TEMPLATE_API_ENABLED=true');
  }

  if (!createUrl) {
    throw new Error('AISENSY_TEMPLATE_CREATE_URL is required when AISENSY_TEMPLATE_API_ENABLED=true');
  }

  if (!statusUrl) {
    throw new Error('AISENSY_TEMPLATE_STATUS_URL is required when AISENSY_TEMPLATE_API_ENABLED=true');
  }

  return {
    enabled: true,
    apiKey,
    createUrl,
    statusUrl,
  };
}
