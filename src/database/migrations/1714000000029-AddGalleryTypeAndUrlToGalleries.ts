import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGalleryTypeAndUrlToGalleries1714000000029 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.galleries
      ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'gallery',
      ADD COLUMN IF NOT EXISTS url TEXT;
    `);
    await queryRunner.query(`
      ALTER TABLE public.galleries
      DROP CONSTRAINT IF EXISTS chk_galleries_type,
      ADD CONSTRAINT chk_galleries_type CHECK (type IN ('gallery', 'link'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.galleries
      DROP CONSTRAINT IF EXISTS chk_galleries_type,
      DROP COLUMN IF EXISTS type,
      DROP COLUMN IF EXISTS url;
    `);
  }
}
