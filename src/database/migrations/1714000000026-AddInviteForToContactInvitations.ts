import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInviteForToContactInvitations1714000000026 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      ADD COLUMN IF NOT EXISTS invite_for VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      DROP COLUMN IF EXISTS invite_for;
    `);
  }
}
