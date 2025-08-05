import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeletedChatsTable1714000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.deleted_chats (
        id BIGINT NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ) PRIMARY KEY,
        contact_id BIGINT NOT NULL,
        user_id BIGINT NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_deleted_chats_contact FOREIGN KEY (contact_id)
          REFERENCES public.contacts (id) ON DELETE CASCADE,
        CONSTRAINT fk_deleted_chats_user FOREIGN KEY (user_id)
          REFERENCES public.users (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_deleted_chats_contact 
        ON public.deleted_chats(contact_id);

      CREATE INDEX IF NOT EXISTS idx_deleted_chats_user 
        ON public.deleted_chats(user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.deleted_chats CASCADE;
    `);
  }
}
