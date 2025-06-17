import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1749840731624 implements MigrationInterface {
  name = 'CreateCategoriesTable1749840731624';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if categories table exists
    const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'categories'
            );
        `);

    if (!tableExists[0].exists) {
      await queryRunner.query(`
                CREATE TABLE categories (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    user_id BIGINT NOT NULL,
                    parent_id INTEGER,
                    created_at TIMESTAMP NOT NULL DEFAULT now(),
                    updated_at TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT fk_categories_user
                        FOREIGN KEY (user_id)
                        REFERENCES users(id)
                        ON DELETE CASCADE,
                    CONSTRAINT fk_categories_parent
                        FOREIGN KEY (parent_id)
                        REFERENCES categories(id)
                        ON DELETE SET NULL
                );

                CREATE INDEX idx_categories_user ON categories(user_id);
                CREATE INDEX idx_categories_parent ON categories(parent_id);
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if categories table exists before dropping
    const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'categories'
            );
        `);

    if (tableExists[0].exists) {
      await queryRunner.query(`DROP TABLE categories;`);
    }
  }
}
