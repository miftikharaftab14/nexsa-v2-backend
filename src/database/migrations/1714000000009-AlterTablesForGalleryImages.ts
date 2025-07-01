import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTablesForGalleryImages1714000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.products CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        media_urls TEXT[] DEFAULT '{}',
        category_id INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
      ALTER TABLE public.products
      ADD CONSTRAINT fk_products_category
      FOREIGN KEY (category_id)
      REFERENCES public.categories(id)
      ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
    `);
  }
}
