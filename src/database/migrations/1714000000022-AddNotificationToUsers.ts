import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationToUsers1714000000022 implements MigrationInterface {
  name = 'AddNotificationToUsers1714000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD COLUMN notification BOOLEAN NOT NULL DEFAULT true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.users
      DROP COLUMN IF EXISTS notification;
    `);
  }
}

