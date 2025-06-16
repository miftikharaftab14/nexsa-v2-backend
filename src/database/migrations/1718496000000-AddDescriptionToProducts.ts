import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToProducts1718496000000 implements MigrationInterface {
  name = 'AddDescriptionToProducts1718496000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN description TEXT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN description;
    `);
  }
}
