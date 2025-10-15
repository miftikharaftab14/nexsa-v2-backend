import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBlocksTable1714000000021 implements MigrationInterface {
  name = 'CreateBlocksTable1714000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.blocks (
        id SERIAL PRIMARY KEY,
        blocker_id BIGINT NOT NULL,
        blocked_id BIGINT NOT NULL,
        reason TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_block UNIQUE (blocker_id, blocked_id),
        CONSTRAINT fk_blocks_blocker FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE,
        CONSTRAINT fk_blocks_blocked FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_blocks_blocked;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_blocks_blocker;`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.blocks;`);
  }
}


