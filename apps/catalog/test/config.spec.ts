import { readConfig } from '../src/config';

const base = {
  APP_ENV: 'dev',
  DATABASE_URL: 'postgresql://catalog:catalog_dev_password@localhost:55432/catalog_db',
};

describe('environment configuration', () => {
  it('accepts explicit development credentials', () => {
    expect(readConfig(base)).toMatchObject({
      appEnv: 'dev',
      port: 8081,
      corsOrigin: 'http://localhost:3000',
    });
  });
  it.each(['qa', 'prod'])('requires external credentials for %s', (APP_ENV) => {
    expect(() => readConfig({ ...base, APP_ENV })).toThrow('external credentials');
    expect(
      readConfig({
        APP_ENV,
        DATABASE_URL: 'postgresql://catalog:external-test-value@db/catalog_db',
        CORS_ORIGIN: 'https://shop.example',
      }).appEnv,
    ).toBe(APP_ENV);
  });
  it.each(['', 'staging', 'production'])('rejects ambiguous APP_ENV %s', (APP_ENV) => {
    expect(() => readConfig({ ...base, APP_ENV })).toThrow('APP_ENV');
  });
  it.each(['0', '65536', '1.5', 'oops'])('rejects invalid port %s', (PORT) => {
    expect(() => readConfig({ ...base, PORT })).toThrow('PORT');
  });
  it.each([
    'postgresql://amaranta:secret@db/amaranta',
    'https://catalog:secret@db/catalog_db',
    'postgresql://db/catalog_db',
    'invalid',
  ])('rejects wrong database/URL without leaking it', (DATABASE_URL) => {
    expect(() => readConfig({ ...base, DATABASE_URL })).toThrow('DATABASE_URL');
  });
  it('requires an explicit origin in qa/prod and rejects wildcard origins', () => {
    expect(() => readConfig({ ...base, CORS_ORIGIN: '*' })).toThrow('CORS_ORIGIN');
    expect(() =>
      readConfig({ APP_ENV: 'qa', DATABASE_URL: 'postgresql://catalog:test-secret@db/catalog_db' }),
    ).toThrow('CORS_ORIGIN');
  });
});
