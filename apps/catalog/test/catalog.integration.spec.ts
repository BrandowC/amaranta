import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import Ajv from 'ajv';
import { createApp } from '../src/app';
import { readConfig } from '../src/config';
import contract from '../contracts/openapi.json';

const databaseUrl = process.env.CATALOG_TEST_DATABASE_URL;
if (!databaseUrl || new URL(databaseUrl).username !== 'catalog_test') {
  throw new Error(
    'Integration suite requires CATALOG_TEST_DATABASE_URL with isolated catalog_test credentials',
  );
}
const config = readConfig({ APP_ENV: 'dev', DATABASE_URL: databaseUrl });
const validate = new Ajv().compile(
  contract.paths['/v1/products'].get.responses['200'].content['application/json'].schema,
);

describe('Catalog HTTP + real PostgreSQL + provider contract', () => {
  let app: INestApplication;
  let db: DataSource;
  let url: string;
  const ids = [randomUUID(), randomUUID(), randomUUID()];

  beforeAll(async () => {
    app = await createApp(config, false);
    db = app.get(DataSource);
    await db.query(
      `INSERT INTO catalog.products(id, sku, name, description, category, price_amount, stock_quantity, image_url, is_active)
      VALUES ($1::uuid,$1::text,'A food','Fixture','FOOD',8500,0,'',true),
             ($2::uuid,$2::text,'B toy','Fixture','TOYS',32000,5,'',true),
             ($3::uuid,$3::text,'C hidden','Fixture','FOOD',1000,1,'',false)`,
      ids,
    );
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });

  afterAll(async () => {
    if (db?.isInitialized)
      await db.query('DELETE FROM catalog.products WHERE id = ANY($1::uuid[])', [ids]);
    if (app) await app.close();
  });

  it('serves only active rows, includes stock zero and matches the published contract', async () => {
    const res = await fetch(`${url}/v1/products`, {
      headers: { 'x-correlation-id': 'hu-cat-001' },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-correlation-id')).toBe('hu-cat-001');
    const body = await res.json();
    expect(validate(body)).toBe(true);
    expect(body.total).toBe(2);
    expect(body.items.map((p: { id: string }) => p.id)).toEqual(ids.slice(0, 2));
    expect(body.items[0]).toMatchObject({ inStock: false, price: 8500, stockQuantity: 0 });
    expect(validate({ ...body, items: [{ ...body.items[0], price: '8500' }] })).toBe(false);
  });

  it('paginates deterministically and preserves total on empty pages', async () => {
    const second = await (await fetch(`${url}/v1/products?page=2&pageSize=1`)).json();
    expect(second.items[0].id).toBe(ids[1]);
    const empty = await (await fetch(`${url}/v1/products?page=3&pageSize=1`)).json();
    expect(empty).toMatchObject({ items: [], total: 2 });
    expect(validate(empty)).toBe(true);
  });

  it.each([
    'page=0',
    'page=1.5',
    'page=abc',
    'pageSize=51',
    'pageSize=-1',
    'unexpected=1',
    'page=1&page=2',
  ])('rejects malformed request %s', async (query) => {
    expect((await fetch(`${url}/v1/products?${query}`)).status).toBe(400);
  });

  it('enforces database invariants', async () => {
    await expect(
      db.query('UPDATE catalog.products SET stock_quantity = -1 WHERE id = $1', [ids[0]]),
    ).rejects.toThrow();
    await expect(
      db.query('UPDATE catalog.products SET price_amount = 0 WHERE id = $1', [ids[0]]),
    ).rejects.toThrow();
  });

  it('owns only Catalog and records its migration once', async () => {
    const schemas = await db.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('identity','sales','clinical','scheduling')",
    );
    expect(schemas).toEqual([]);
    expect(await db.runMigrations()).toEqual([]);
    expect(await db.query('SELECT name FROM migrations')).toHaveLength(1);
  });

  it('separates liveness from readiness when the database connection fails', async () => {
    expect((await fetch(`${url}/health/ready`)).status).toBe(200);
    await db.destroy();
    try {
      expect((await fetch(`${url}/health/live`)).status).toBe(200);
      const res = await fetch(`${url}/health/ready`);
      expect(res.status).toBe(503);
      expect(JSON.stringify(await res.json())).not.toContain('catalog_test_password');
    } finally {
      await db.initialize();
    }
  });

  it('restarts safely when PostgreSQL search_path prefers the owned Catalog schema', async () => {
    // Reproduce the production catalog role resolving "$user" to schema catalog.
    await db.query('ALTER ROLE catalog_test SET search_path TO catalog, public');
    try {
      await db.destroy();
      await db.initialize();
      expect(await db.query('SELECT name FROM public.migrations')).toHaveLength(1);
      expect(await db.query("SELECT to_regclass('catalog.migrations') AS ledger")).toEqual([
        { ledger: null },
      ]);
      expect((await fetch(`${url}/health/ready`)).status).toBe(200);
      const body = await (await fetch(`${url}/v1/products`)).json();
      expect(body.total).toBe(2);
    } finally {
      if (!db.isInitialized) await db.initialize();
      await db.query('ALTER ROLE catalog_test RESET search_path');
    }
  });
});
