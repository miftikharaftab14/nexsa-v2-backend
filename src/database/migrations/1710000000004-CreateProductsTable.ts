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
      // Create table
      await queryRunner.query(`
        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          media_urls TEXT[] DEFAULT '{}',
          category_id INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // Add foreign key: category
      await queryRunner.query(`
        ALTER TABLE products
        ADD CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL;
      `);

      // Create indexes
      await queryRunner.query(`CREATE INDEX idx_products_category ON products(category_id);`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
