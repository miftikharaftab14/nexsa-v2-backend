import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterGalleryAndGalleryImageAddFields1714000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add notifications_enabled and profile_gallery_image to galleries
    await queryRunner.query(`
      ALTER TABLE public.galleries
      ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS profile_gallery_image BIGINT;
    `);
    await queryRunner.query(`
      ALTER TABLE public.galleries
      ADD CONSTRAINT fk_galleries_profile_gallery_image FOREIGN KEY (profile_gallery_image)
      REFERENCES public.files (id) ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove new fields and revert changes
    await queryRunner.query(`
      ALTER TABLE public.galleries
      DROP CONSTRAINT IF EXISTS fk_galleries_profile_gallery_image,
      DROP COLUMN IF EXISTS notifications_enabled,
      DROP COLUMN IF EXISTS profile_gallery_image;
    `);
  }
}
