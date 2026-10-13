export interface CatalogConfig {
  appEnv: 'dev' | 'qa' | 'prod';
  port: number;
  databaseUrl: string;
  corsOrigin: string;
}

export function readConfig(env: NodeJS.ProcessEnv): CatalogConfig {
  const appEnv = env.APP_ENV;
  if (appEnv !== 'dev' && appEnv !== 'qa' && appEnv !== 'prod') {
    throw new Error('APP_ENV must be dev, qa or prod');
  }
  const port = Number(env.PORT ?? '8081');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  let url: URL;
  try {
    url = new URL(env.DATABASE_URL ?? '');
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL URL');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    url.pathname !== '/catalog_db' ||
    !url.hostname ||
    !url.username ||
    !url.password
  ) {
    throw new Error('DATABASE_URL must use catalog_db and explicit PostgreSQL credentials');
  }
  if (
    appEnv !== 'dev' &&
    (['postgres', 'amaranta'].includes(url.username) ||
      /catalog_dev_password|replace|change.?me/i.test(decodeURIComponent(url.password)))
  ) {
    throw new Error('qa/prod require a dedicated database user and external credentials');
  }
  const corsOrigin = env.CORS_ORIGIN ?? (appEnv === 'dev' ? 'http://localhost:3000' : '');
  try {
    const origin = new URL(corsOrigin);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== corsOrigin) {
      throw new Error();
    }
  } catch {
    throw new Error('CORS_ORIGIN must be an explicit HTTP(S) origin');
  }
  return { appEnv, port, databaseUrl: url.toString(), corsOrigin };
}
