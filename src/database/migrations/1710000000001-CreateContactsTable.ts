import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactsTable1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.contacts (
        id bigint NOT NULL GENERATED ALWAYS AS IDENTITY,
        seller_id bigint NOT NULL,
        invited_user_id bigint,
        phone_number character varying(20) COLLATE pg_catalog."default",
        full_name character varying(100) COLLATE pg_catalog."default",
        email character varying(255) COLLATE pg_catalog."default",
        status character varying(20) COLLATE pg_catalog."default" NOT NULL DEFAULT 'NEW'::character varying,
        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT contacts_pkey PRIMARY KEY (id),
        CONSTRAINT contacts_seller_id_fkey FOREIGN KEY (seller_id)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION,
        CONSTRAINT contacts_invited_user_id_fkey FOREIGN KEY (invited_user_id)
          REFERENCES public.users (id) MATCH SIMPLE
          ON UPDATE NO ACTION
          ON DELETE NO ACTION,
        CONSTRAINT check_contact_status CHECK (status IN ('NEW', 'INVITED', 'ACCEPTED', 'REJECTED','CANCELLED')),
        CONSTRAINT unique_contact_phone_per_seller UNIQUE (seller_id, phone_number),
        CONSTRAINT unique_contact_email_per_seller UNIQUE (seller_id, email)
      );

      -- Add indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_contacts_seller 
        ON public.contacts(seller_id);

      CREATE INDEX IF NOT EXISTS idx_contacts_invited_user 
        ON public.contacts(invited_user_id);

      CREATE INDEX IF NOT EXISTS idx_contacts_status 
        ON public.contacts(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS public.contacts CASCADE;
    `);
  }
}
