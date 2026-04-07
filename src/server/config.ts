export type ServerConfig = {
  mongodbUri: string;
  openaiApiKey?: string;
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
