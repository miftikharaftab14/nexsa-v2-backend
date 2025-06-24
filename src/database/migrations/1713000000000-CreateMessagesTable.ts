import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagesTable1713000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "message_type_enum" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'FILE');
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.messages (
        id SERIAL PRIMARY KEY,
        contact_id BIGINT NOT NULL,
        sender_id BIGINT NOT NULL,
        message_type message_type_enum NOT NULL DEFAULT 'TEXT',
        content TEXT,
        media_key TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_messages_contact FOREIGN KEY (contact_id)
          REFERENCES public.contacts (id) ON DELETE CASCADE,
        CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
          REFERENCES public.users (id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON public.messages(contact_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.messages CASCADE;
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "message_type_enum";
    `);
  }
}
