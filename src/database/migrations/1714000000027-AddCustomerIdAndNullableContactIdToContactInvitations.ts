import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerIdAndNullableContactIdToContactInvitations1714000000027
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      ADD COLUMN IF NOT EXISTS customer_id BIGINT;
    `);

    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      ALTER COLUMN contact_id DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      DROP COLUMN IF EXISTS customer_id;
    `);

    await queryRunner.query(`
      ALTER TABLE public.contact_invitations
      ALTER COLUMN contact_id SET NOT NULL;
    `);
  }
}
