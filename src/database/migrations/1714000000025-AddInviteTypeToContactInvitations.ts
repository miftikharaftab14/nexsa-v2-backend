import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInviteTypeToContactInvitations1714000000025 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      ADD COLUMN IF NOT EXISTS invite_type VARCHAR(20) NOT NULL DEFAULT 'NORMAL';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      DROP COLUMN IF EXISTS invite_type;
    `);
  }
}
