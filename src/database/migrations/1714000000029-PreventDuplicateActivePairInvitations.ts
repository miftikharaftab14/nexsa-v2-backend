import { MigrationInterface, QueryRunner } from 'typeorm';

export class PreventDuplicateActivePairInvitations1714000000029
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Keep only the newest active invitation for each seller/customer/invite_for pair.
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY seller_id, customer_id, invite_for
            ORDER BY created_at DESC, id DESC
          ) AS row_num
        FROM public.contact_invitations
        WHERE customer_id IS NOT NULL
          AND status IN ('PENDING', 'REQUESTED', 'ACCEPTED')
      )
      DELETE FROM public.contact_invitations ci
      USING ranked r
      WHERE ci.id = r.id
        AND r.row_num > 1;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_contact_invitation_pair
      ON public.contact_invitations (seller_id, customer_id, invite_for)
      WHERE customer_id IS NOT NULL
        AND status IN ('PENDING', 'REQUESTED', 'ACCEPTED');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS public.uniq_active_contact_invitation_pair;
    `);
  }
}
