import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBroadcastRecipientsTable1713000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.broadcast_recipients (
        broadcast_id INTEGER NOT NULL,
        customer_id BIGINT NOT NULL,
        PRIMARY KEY (broadcast_id, customer_id),
        CONSTRAINT fk_broadcast_recipients_broadcast FOREIGN KEY (broadcast_id)
          REFERENCES public.broadcasts (id) ON DELETE CASCADE,
        CONSTRAINT fk_broadcast_recipients_customer FOREIGN KEY (customer_id)
          REFERENCES public.users (id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast_id ON public.broadcast_recipients(broadcast_id);
      CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_customer_id ON public.broadcast_recipients(customer_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.broadcast_recipients CASCADE;
    `);
  }
}
