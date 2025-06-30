import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReadToMessages1714000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.messages
        ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.messages
        DROP COLUMN IF EXISTS read;
    `);
  }
}
