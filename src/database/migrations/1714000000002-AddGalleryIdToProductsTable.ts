import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGalleryIdToProductsTable1714000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.products
      ADD COLUMN IF NOT EXISTS gallery_id INTEGER NULL,
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
      ADD CONSTRAINT fk_products_gallery FOREIGN KEY (gallery_id)
        REFERENCES public.galleries (id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_products_gallery_id ON public.products(gallery_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.products
      DROP CONSTRAINT IF EXISTS fk_products_gallery;
      DROP COLUMN IF EXISTS gallery_id;
      DROP COLUMN IF EXISTS is_deleted;
      DROP INDEX IF EXISTS idx_products_gallery_id;
    `);
  }
}
