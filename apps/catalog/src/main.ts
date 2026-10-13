import { createApp } from './app';
import { readConfig } from './config';

async function bootstrap() {
  const config = readConfig(process.env);
  const app = await createApp(config);
  try {
    await app.listen(config.port, '0.0.0.0');
  } catch (error) {
    await app.close();
    throw error;
  }
}

bootstrap().catch(() => {
  // Never print a connection URL or driver error that may contain credentials.
  console.error('Catalog startup failed; check configuration, database and migrations');
  process.exitCode = 1;
});
