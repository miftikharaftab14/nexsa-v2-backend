import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGalleryImagesTable1714000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.gallery_image (
        id SERIAL PRIMARY KEY,
        media_file_id BIGINT,
        gallery_id INTEGER,
        user_id BIGINT,
        is_deleted BOOLEAN DEFAULT FALSE,
        on_sale BOOLEAN DEFAULT FALSE,
        price NUMERIC,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_gallery_image_gallery FOREIGN KEY (gallery_id)
          REFERENCES public.galleries (id) ON DELETE SET NULL,
        CONSTRAINT fk_gallery_image_user FOREIGN KEY (user_id)
          REFERENCES public.users (id) ON DELETE SET NULL,
        CONSTRAINT fk_gallery_image_media_file FOREIGN KEY (media_file_id)
          REFERENCES public.files (id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_gallery_image_gallery_id ON public.gallery_image(gallery_id);
      CREATE INDEX IF NOT EXISTS idx_gallery_image_user_id ON public.gallery_image(user_id);
      CREATE INDEX IF NOT EXISTS idx_gallery_image_media_file_id ON public.gallery_image(media_file_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.gallery_image CASCADE;
    `);
  }
}
