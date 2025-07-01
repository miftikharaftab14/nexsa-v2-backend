import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameGalleriesLikesToGalleryImagesLikes1714000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Only rename if source table exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'galleries_likes'
        ) THEN
          ALTER TABLE public.galleries_likes RENAME TO gallery_images_likes;
        END IF;
      END
      $$;
    `);

    // Only rename indexes if the new table exists
    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'gallery_images_likes'
        ) THEN
          FOR r IN 
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'gallery_images_likes'
          LOOP
            EXECUTE 'ALTER INDEX ' || quote_ident(r.indexname) || 
                    ' RENAME TO ' || quote_ident(replace(r.indexname, 'galleries_likes', 'gallery_images_likes'));
          END LOOP;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'gallery_images_likes'
        ) THEN
          FOR r IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'gallery_images_likes'::regclass
          LOOP
            IF position('galleries_likes' in r.conname) > 0 THEN
              EXECUTE 'ALTER TABLE gallery_images_likes RENAME CONSTRAINT ' || quote_ident(r.conname) ||
                      ' TO ' || quote_ident(replace(r.conname, 'galleries_likes', 'gallery_images_likes'));
            END IF;
          END LOOP;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Same safeguard pattern for rollback
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'gallery_images_likes'
        ) THEN
          ALTER TABLE public.gallery_images_likes RENAME TO galleries_likes;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'galleries_likes'
        ) THEN
          FOR r IN 
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'galleries_likes'
          LOOP
            EXECUTE 'ALTER INDEX ' || quote_ident(r.indexname) || 
                    ' RENAME TO ' || quote_ident(replace(r.indexname, 'gallery_images_likes', 'galleries_likes'));
          END LOOP;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE r RECORD;
      BEGIN
        IF EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'galleries_likes'
        ) THEN
          FOR r IN 
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'galleries_likes'::regclass
          LOOP
            IF position('gallery_images_likes' in r.conname) > 0 THEN
              EXECUTE 'ALTER TABLE galleries_likes RENAME CONSTRAINT ' || quote_ident(r.conname) ||
                      ' TO ' || quote_ident(replace(r.conname, 'gallery_images_likes', 'galleries_likes'));
            END IF;
          END LOOP;
        END IF;
      END
      $$;
    `);
  }
}
