export type ServerConfig = {
  mongodbUri: string;
  anthropicApiKey?: string;
};

type EnvShape = Record<string, string | undefined>;

export function getServerConfig(env: EnvShape = process.env): ServerConfig {
  const mongodbUri = env.MONGODB_URI?.trim();

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required');
  }

  const anthropicApiKey = env.ANTHROPIC_API_KEY?.trim() || undefined;

  return {
    mongodbUri,
    anthropicApiKey,
  };
}

export function getAnthropicApiKey(env: EnvShape = process.env): string {
  const apiKey = env.APP_ANTHROPIC_API_KEY?.trim() || env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('APP_ANTHROPIC_API_KEY is required — set it in .env.local to use AI template generation');
  }

  return apiKey;
}
