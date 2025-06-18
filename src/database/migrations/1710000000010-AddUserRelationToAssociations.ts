import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterCategoryAssociationsAddUserRelation1710000000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'category_associations') THEN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'category_associations' AND column_name = 'user_id'
          ) THEN
            ALTER TABLE category_associations ADD COLUMN user_id BIGINT;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'category_associations' 
              AND tc.constraint_type = 'FOREIGN KEY' 
              AND kcu.column_name = 'user_id'
          ) THEN
            ALTER TABLE category_associations
            ADD CONSTRAINT fk_category_associations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
          END IF;
        END IF;
      END;
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'category_associations') THEN
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'category_associations' 
              AND tc.constraint_type = 'FOREIGN KEY' 
              AND kcu.column_name = 'user_id'
          ) THEN
            ALTER TABLE category_associations DROP CONSTRAINT fk_category_associations_user;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'category_associations' AND column_name = 'user_id'
          ) THEN
            ALTER TABLE category_associations DROP COLUMN user_id;
          END IF;
        END IF;
      END;
      $$;
    `);
  }
}
