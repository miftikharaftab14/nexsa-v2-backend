import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1710000000004 implements MigrationInterface {
  name = 'CreateProductsTable1710000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if products table exists
    const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'products'
            );
        `);

    if (!tableExists[0].exists) {
      await queryRunner.query(`
                CREATE TABLE products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    media_urls TEXT[] DEFAULT '{}',
                    category_id INTEGER,
                    user_id BIGINT NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT now(),
                    updated_at TIMESTAMP NOT NULL DEFAULT now(),
                    CONSTRAINT fk_products_category
                        FOREIGN KEY (category_id)
                        REFERENCES categories(id)
                        ON DELETE SET NULL,
                    CONSTRAINT fk_products_user
                        FOREIGN KEY (user_id)
                        REFERENCES users(id)
                        ON DELETE CASCADE
                );

                CREATE INDEX idx_products_category ON products(category_id);
                CREATE INDEX idx_products_user ON products(user_id);
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if products table exists before dropping
    const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'products'
            );
        `);

    if (tableExists[0].exists) {
      await queryRunner.query(`DROP TABLE products;`);
    }
  }
}
