import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterMediaKeyToBigintInMessagesTable1714000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.messages
      ALTER COLUMN media_key TYPE BIGINT USING media_key::bigint;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.messages
      ALTER COLUMN media_key TYPE TEXT USING media_key::text;
    `);
  }
}
