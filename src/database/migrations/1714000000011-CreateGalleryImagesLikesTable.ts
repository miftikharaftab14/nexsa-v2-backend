import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGalleryImageLikesTable1714000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.gallery_image_likes (
        id SERIAL PRIMARY KEY,
        gallery_image_id INTEGER NOT NULL,
        customer_id BIGINT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_gallery_image_likes_gallery_image FOREIGN KEY (gallery_image_id)
          REFERENCES public.gallery_image (id) ON DELETE CASCADE,
        CONSTRAINT fk_gallery_image_likes_customer FOREIGN KEY (customer_id)
          REFERENCES public.users (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_gallery_image_likes_gallery_image 
        ON public.gallery_image_likes(gallery_image_id);

      CREATE INDEX IF NOT EXISTS idx_gallery_image_likes_customer 
        ON public.gallery_image_likes(customer_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.gallery_image_likes CASCADE;
    `);
  }
}
