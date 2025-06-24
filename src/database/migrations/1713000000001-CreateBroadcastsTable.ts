import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBroadcastsTable1713000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.broadcasts (
        id SERIAL PRIMARY KEY,
        seller_id BIGINT NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_broadcasts_seller FOREIGN KEY (seller_id)
          REFERENCES public.users (id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_broadcasts_seller_id ON public.broadcasts(seller_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.broadcasts CASCADE;
    `);
  }
}
