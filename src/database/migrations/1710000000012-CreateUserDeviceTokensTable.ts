import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserDeviceTokensTable1710000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.user_device_tokens (
        id SERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        device_token TEXT NOT NULL UNIQUE,
        device_type VARCHAR(50),
        device_os VARCHAR(50),
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_device_tokens_user FOREIGN KEY (user_id)
          REFERENCES public.users (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id ON public.user_device_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_device_tokens_device_token ON public.user_device_tokens(device_token);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.user_device_tokens CASCADE;
    `);
  }
}
