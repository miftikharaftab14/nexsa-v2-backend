import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropCategoriesAndAssociationsTables1714000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.category_associations CASCADE;
      DROP TABLE IF EXISTS public.categories CASCADE;
    `);
  }

  public async down(): Promise<void> {
    // No down migration for drop table
  }
}
