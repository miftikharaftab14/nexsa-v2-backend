import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCategoriesToMatchEntity1710000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop unused columns
    await queryRunner.query(`
      DO $$ BEGIN

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'categories' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_user;
          ALTER TABLE categories DROP COLUMN user_id;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'categories' AND column_name = 'parent_id'
        ) THEN
          ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_parent;
          ALTER TABLE categories DROP COLUMN parent_id;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'categories' AND column_name = 'preferences_id'
        ) THEN
          ALTER TABLE categories DROP CONSTRAINT IF EXISTS fk_categories_preferences;
          ALTER TABLE categories DROP COLUMN preferences_id;
        END IF;
      END $$;
    `);

    // Add missing columns
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'categories' AND column_name = 'system_generated'
        ) THEN
          ALTER TABLE categories ADD COLUMN system_generated BOOLEAN DEFAULT false;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'categories' AND column_name = 'created_at'
        ) THEN
          ALTER TABLE categories ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'categories' AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE categories ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optional: reverse changes
    await queryRunner.query(`
      ALTER TABLE categories 
      DROP COLUMN IF EXISTS system_generated,
      DROP COLUMN IF EXISTS created_at,
      DROP COLUMN IF EXISTS updated_at;

      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS user_id BIGINT,
      ADD COLUMN IF NOT EXISTS parent_id INTEGER,
      ADD COLUMN IF NOT EXISTS preferences_id INTEGER;
    `);

    // Recreate FKs if needed
    await queryRunner.query(`
      ALTER TABLE categories 
      ADD CONSTRAINT IF NOT EXISTS fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      ADD CONSTRAINT IF NOT EXISTS fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
      ADD CONSTRAINT IF NOT EXISTS fk_categories_preferences FOREIGN KEY (preferences_id) REFERENCES preferences(id) ON DELETE CASCADE;
    `);
  }
}
