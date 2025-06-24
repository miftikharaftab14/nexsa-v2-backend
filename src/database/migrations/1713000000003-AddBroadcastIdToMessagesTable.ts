import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBroadcastIdToMessagesTable1713000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'messages' AND column_name = 'broadcast_id'
        ) THEN
          ALTER TABLE messages ADD COLUMN broadcast_id INTEGER NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'messages' AND constraint_name = 'fk_messages_broadcast'
        ) THEN
          ALTER TABLE messages
          ADD CONSTRAINT fk_messages_broadcast FOREIGN KEY (broadcast_id)
            REFERENCES broadcasts(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_broadcast_id ON public.messages(broadcast_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_broadcast;
    `);
    await queryRunner.query(`
      ALTER TABLE messages DROP COLUMN IF EXISTS broadcast_id;
    `);
  }
}
