export type ServerConfig = {
  mongodbUri: string;
};

type EnvShape = Record<string, string | undefined>;

export function getServerConfig(env: EnvShape = process.env): ServerConfig {
  const mongodbUri = env.MONGODB_URI?.trim();

  if (!mongodbUri) {
    throw new Error('MONGODB_URI is required');
  }

  return {
    mongodbUri,
  };
}
