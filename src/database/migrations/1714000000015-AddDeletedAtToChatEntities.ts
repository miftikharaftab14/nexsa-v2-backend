import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToChatEntities1714000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.messages
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE public.broadcasts
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE public.broadcast_recipients
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.messages
      DROP COLUMN IF EXISTS deleted_at;
    `);
    await queryRunner.query(`
      ALTER TABLE public.broadcasts
      DROP COLUMN IF EXISTS deleted_at;
    `);
    await queryRunner.query(`
      ALTER TABLE public.broadcast_recipients
      DROP COLUMN IF EXISTS deleted_at;
    `);
  }
}
