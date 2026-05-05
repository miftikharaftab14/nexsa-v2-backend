import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeletedMessagesTable1714000000031 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.deleted_messages (
        id BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ) PRIMARY KEY,
        message_id INT NOT NULL,
        user_id BIGINT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_deleted_messages_message FOREIGN KEY (message_id)
          REFERENCES public.messages (id) ON DELETE CASCADE,
        CONSTRAINT fk_deleted_messages_user FOREIGN KEY (user_id)
          REFERENCES public.users (id) ON DELETE CASCADE,
        CONSTRAINT uq_deleted_messages_user_message UNIQUE (user_id, message_id)
      );

      CREATE INDEX IF NOT EXISTS idx_deleted_messages_message
        ON public.deleted_messages(message_id);

      CREATE INDEX IF NOT EXISTS idx_deleted_messages_user
        ON public.deleted_messages(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.deleted_messages CASCADE;
    `);
  }
}
