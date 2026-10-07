import { DataSource } from 'typeorm';
import { CatalogConfig } from '../config';
import { CatalogProducts1791331200000 } from './migrations/1791331200000-catalog-products';

export function createDatabase(config: CatalogConfig): DataSource {
  return new DataSource({
    type: 'postgres',
    url: config.databaseUrl,
    // A role named catalog resolves "$user" to catalog after the first migration.
    // Pin the migration ledger so restarts never create a second, empty ledger.
    schema: 'public',
    synchronize: false,
    migrationsRun: true,
    migrations: [CatalogProducts1791331200000],
    migrationsTransactionMode: 'all',
    extra: { connectionTimeoutMillis: 2000, statement_timeout: 2000, max: 5 },
  });
}
