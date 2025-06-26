import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGalleriesTables1714000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.galleries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id BIGINT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE,
        CONSTRAINT fk_galleries_user FOREIGN KEY (user_id)
          REFERENCES public.users (id) ON DELETE CASCADE,
        CONSTRAINT uq_galleries_user_name UNIQUE (user_id, name)
      );
      CREATE INDEX IF NOT EXISTS idx_galleries_user_id ON public.galleries(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.galleries CASCADE;
    `);
  }
}
