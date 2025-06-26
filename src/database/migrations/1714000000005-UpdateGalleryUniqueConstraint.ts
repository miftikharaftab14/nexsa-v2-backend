import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGalleryUniqueConstraint1714000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Drop the old unique constraint
      ALTER TABLE public.galleries DROP CONSTRAINT IF EXISTS uq_galleries_user_name;

      -- Create a partial unique index instead
      CREATE UNIQUE INDEX IF NOT EXISTS uq_galleries_user_name_not_deleted
      ON public.galleries(user_id, name)
      WHERE is_deleted = false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Drop the partial index
      DROP INDEX IF EXISTS uq_galleries_user_name_not_deleted;

      -- Recreate the original unique constraint
      ALTER TABLE public.galleries
      ADD CONSTRAINT uq_galleries_user_name UNIQUE (user_id, name);
    `);
  }
}
