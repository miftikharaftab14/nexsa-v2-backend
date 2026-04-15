import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add invite_url column for seller invite path (no base URL stored).
 * link_name remains unchanged and in use for other purposes.
 */
export class AddInviteUrlToUsers1714000000024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD COLUMN IF NOT EXISTS invite_url TEXT;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_url_unique
      ON public.users (invite_url)
      WHERE invite_url IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS public.idx_users_invite_url_unique;
    `);
    await queryRunner.query(`
      ALTER TABLE public.users
      DROP COLUMN IF EXISTS invite_url;
    `);
  }
}
