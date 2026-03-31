import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateInvitationStatusConstraintAddRequested1714000000028
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      DROP CONSTRAINT IF EXISTS check_invitation_status;
    `);

    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      ADD CONSTRAINT check_invitation_status
      CHECK (status IN ('PENDING', 'REQUESTED', 'ACCEPTED', 'CANCELLED', 'REJECTED'));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      DROP CONSTRAINT IF EXISTS check_invitation_status;
    `);

    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      ADD CONSTRAINT check_invitation_status
      CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELLED', 'REJECTED'));
    `);
  }
}
