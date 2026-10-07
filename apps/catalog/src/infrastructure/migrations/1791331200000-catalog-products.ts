import { MigrationInterface, QueryRunner } from 'typeorm';

export class CatalogProducts1791331200000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    // Preserve the existing Catalog table shape and UUID ownership.
    await runner.query(`
      CREATE SCHEMA catalog;
      CREATE TABLE catalog.products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sku varchar(50) NOT NULL UNIQUE,
        name varchar(120) NOT NULL,
        description varchar(500) NOT NULL,
        category varchar(20) NOT NULL CHECK (category IN ('FOOD','ACCESSORIES','HYGIENE','MEDICATION','TOYS')),
        price_amount integer NOT NULL CHECK (price_amount > 0),
        stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
        image_url varchar(500) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_products_active_name ON catalog.products(name, id) WHERE is_active = true;
    `);
  }

  async down(): Promise<void> {
    throw new Error('Destructive rollback disabled; use a reviewed forward migration');
  }
}
