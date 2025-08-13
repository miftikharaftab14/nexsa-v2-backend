import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToPreferences1714000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add user_id column and foreign key to users table
    await queryRunner.query(`
      ALTER TABLE public.preferences
      ADD COLUMN user_id BIGINT NULL,
      ADD CONSTRAINT fk_user_pref FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON DELETE CASCADE;
    `);

    // Create index for faster lookups by user
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pref_user
        ON public.preferences(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key and column
    await queryRunner.query(`
      ALTER TABLE public.preferences
      DROP CONSTRAINT IF EXISTS fk_user_pref,
      DROP COLUMN IF EXISTS user_id;
    `);

    // Drop index if exists
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_pref_user;
    `);
  }
}
