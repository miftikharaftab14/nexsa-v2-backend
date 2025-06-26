import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoryAssociationsTable1710000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE category_associations (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL,
        seller_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        CONSTRAINT fk_user FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE category_associations;`);
  }
}
