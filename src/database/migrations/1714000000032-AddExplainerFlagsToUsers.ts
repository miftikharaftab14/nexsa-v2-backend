import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExplainerFlagsToUsers1714000000032 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.users
      ADD COLUMN seller_explainer BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN customer_explainer BOOLEAN NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.users
      DROP COLUMN IF EXISTS seller_explainer,
      DROP COLUMN IF EXISTS customer_explainer;
    `);
  }
}

