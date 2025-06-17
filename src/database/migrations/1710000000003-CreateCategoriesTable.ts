import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesTable1710000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id BIGINT NOT NULL,
        parent_id INTEGER,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_categories_user FOREIGN KEY (user_id)
          REFERENCES public.users (id)
          ON DELETE CASCADE,
        
        CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id)
          REFERENCES public.categories (id)
          ON DELETE SET NULL
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
      CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.categories CASCADE;
    `);
  }
}
