import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToProductsTable1710000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add `user_id` column if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE products ADD COLUMN user_id BIGINT;
        END IF;
      END $$;
    `);

    // Add foreign key constraint if not exists
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'products' AND constraint_name = 'fk_products_user'
        ) THEN
          ALTER TABLE products
          ADD CONSTRAINT fk_products_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK and column if they exist
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'products' AND constraint_name = 'fk_products_user'
        ) THEN
          ALTER TABLE products DROP CONSTRAINT fk_products_user;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'products' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE products DROP COLUMN user_id;
        END IF;
      END $$;
    `);
  }
}
