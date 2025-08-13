import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLinkNameToUsers1714000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD COLUMN link_name VARCHAR(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.users
      DROP COLUMN IF EXISTS link_name;
    `);
  }
}
