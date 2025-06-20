import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductLikesTable1710000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.product_likes (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        customer_id BIGINT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_product_likes_product FOREIGN KEY (product_id)
          REFERENCES public.products (id) ON DELETE CASCADE,
        CONSTRAINT fk_product_likes_customer FOREIGN KEY (customer_id)
          REFERENCES public.users (id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_product_likes_product ON public.product_likes(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_likes_customer ON public.product_likes(customer_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.product_likes CASCADE;
    `);
  }
}
