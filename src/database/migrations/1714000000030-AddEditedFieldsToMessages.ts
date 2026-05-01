import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEditedFieldsToMessages1714000000030 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.messages
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      ALTER TABLE public.messages
      ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.messages
      DROP COLUMN IF EXISTS edited_at;
    `);

    await queryRunner.query(`
      ALTER TABLE public.messages
      DROP COLUMN IF EXISTS is_edited;
    `);
  }
}
