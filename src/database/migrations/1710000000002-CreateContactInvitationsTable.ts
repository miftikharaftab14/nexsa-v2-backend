// src/database/migrations/1710000000002-CreateContactInvitationsTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactInvitationsTable1710000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.contact_invitations (
        id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        contact_id bigint NOT NULL,
        seller_id bigint NOT NULL,
        invite_token character varying(255) NOT NULL,
        method character varying(10) NOT NULL,
        invite_sent_at timestamp without time zone NOT NULL,
        invite_cancelled_at timestamp without time zone,
        invite_accepted_at timestamp without time zone,
        status character varying(20) NOT NULL DEFAULT 'PENDING',
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT contact_invitations_pkey PRIMARY KEY (id),
        CONSTRAINT contact_invitations_invite_token_key UNIQUE (invite_token),
        CONSTRAINT contact_invitations_contact_id_fkey FOREIGN KEY (contact_id)
          REFERENCES public.contacts (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION,
        CONSTRAINT contact_invitations_seller_id_fkey FOREIGN KEY (seller_id)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION,
        CONSTRAINT check_invitation_status CHECK (status IN ('PENDING', 'ACCEPTED', 'CANCELLED','REJECTED')),
        CONSTRAINT check_invitation_method CHECK (method IN ('SMS', 'EMAIL'))
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.contact_invitations;`);
  }
}
